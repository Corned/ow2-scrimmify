import { createWorker, PSM } from 'tesseract.js';

/* import fs from "fs" */
import { log, PNG } from "pngjs/browser"


const maps = [
  "Antarctic Peninsula",
  "Busan",
  "Ilios",
  "Lijiang Tower",
  "Nepal",
  "Oasis",
  "Samoa",

  "Circuit Royal",
  "Dorado",
  "Havana",
  "Junkertown",
  "Rialto",
  "Route 66",
  "Shambali Monastery",
  "Watchpoint: Gibraltar",

  "New Junk City",
  "Suravasa",

  "Blizzard World",
  "Eichenwalde",
  "Hollywood",
  "King's Row",
  "Midtown",
  "Numbani",
  "Paraíso",

  "Colosseo",
  "Esperanca",
  "New Queen Street",
]



function rgb2hsv (r, g, b) {
  let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
  rabs = r / 255;
  gabs = g / 255;
  babs = b / 255;
  v = Math.max(rabs, gabs, babs)
  diff = v - Math.min(rabs, gabs, babs);
  diffc = c => (v - c) / 6 / diff + 1 / 2;
  percentRoundFn = num => Math.round(num * 100) / 100;
  if (diff == 0) {
      h = s = 0;
  } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
          h = bb - gg;
      } else if (gabs === v) {
          h = (1 / 3) + rr - bb;
      } else if (babs === v) {
          h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
          h += 1;
      }else if (h > 1) {
          h -= 1;
      }
  }
  return {
      h: Math.round(h * 360),
      s: percentRoundFn(s * 100),
      v: percentRoundFn(v * 100)
  };
}

const modImage = (file) => {


  return new Promise((resolve) => {
    const filereader = new FileReader()
    filereader.onloadend = (event) => {
      new PNG({ filterType: 4 }).parse(event.target.result, async (error, image) => {
        for (var y = 0; y < image.height; y++) {
          for (var x = 0; x < image.width; x++) {
            var idx = (image.width * y + x) << 2;
      
            const [ r, g, b ] = [ image.data[idx], image.data[idx + 1], image.data[idx + 2] ]
            const { h, s, v } = rgb2hsv(image.data[idx], image.data[idx + 1], image.data[idx + 2])

      
            if (h > 3 || s > 10 || v < 90) {
              image.data[idx + 0] = 255 
              image.data[idx + 1] = 255  
              image.data[idx + 2] = 255 
      
            } else {
              image.data[idx + 0] = 0
              image.data[idx + 1] = 0
              image.data[idx + 2] = 0
            }
      
          }
        }
      
        const buffer = PNG.sync.write(image, { colorType: 6 })

        var blob = new Blob([buffer], { type: "image/png" });
        var url = URL.createObjectURL(blob);

        resolve({ blobUrl: url, width: image.width, height: image.height })      
      })
    }

    
    filereader.readAsArrayBuffer(file)

  })
}


const getMaps = async (file, width, height) => {
  const worker = await createWorker("eng", 1)
  await worker.setParameters({
    //tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
    tessedit_pageseg_mode: PSM.SPARSE_TEXT
  })

  const rectangle = {
    top: 0,
    left: 0,
    width: width / 4,
    height: height,
  }

  const { data: { blocks } } = await worker.recognize(file, { rectangle })
  await worker.terminate()

  const maps = blocks.map((block) => {
    const words = block.paragraphs[0].lines[0].words.map((word) => {
      if (word.text.length < 3) {
        return { text: "", confident: true }
      }

      // Tesseract just refuses to recognize "Ç"
      if (word.text === "ESPERANGA") {
        return { text: "ESPERANÇA", confident: true }
      }

      // Tesseract just refuses to recognize "Í"
      if (word.text === "PARAISO") {
        return { text: "PARAÍSO", confident: true }
      }


      return { text: word.text, confident: word.confidence > 60 }
    }).reduce((previousValue, currentValue) => {
      return {
        text: (previousValue.text + " " + currentValue.text).trim(),
        confident: previousValue === false ? false : currentValue.confident
      }
    }, { text: "", confident: true })

    return words
  })
  
  return maps.filter(({ text }) => text.length > 3)
}

const getCode = async (file, top, left, width, height) => {
  const worker = await createWorker("eng", 1)
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:",
  })

  const rectangle = {
    top, left,
    width, height,
  }

  const { data: { blocks } } = await worker.recognize(file, { rectangle })
  await worker.terminate()

  const codes = blocks[0].paragraphs[0].lines.map((line) => {
    const [ word ] = line.words.filter(({ text }) => text.length > 3)
    const code = word.symbols.map((symbol) => {
      console.log(symbol.text, symbol.confidence)
      return {
        symbol: symbol.text === ":" ? "" : symbol.text,
        confident: symbol.confidence > 80
      }
    })

    return code
  })
  
  return codes
}


const ocr = async (file, width, height) => {

  const maps = await getMaps(file, width, height)
  const codes = await getCode(file, 0, 683, 150, height)
  
  console.log({ maps, codes }); 

  return { maps, codes }
}


export { modImage, ocr }