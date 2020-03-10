const express = require('express');
const si = require('systeminformation');
const exec = require('child_process').exec;
const app = express()
const port = 3000


app.get('/', (req, res) => res.send('Hello World!'))
app.get('/cpu', async (req, res) => {
  const cpuTemp = await getCpuTemperature();
  console.log("cpu temp:", cpuTemp);
  res.send(`CPU Temp: ${cpuTemp}`)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

async function getCpuTemperature() {
  return new Promise((resolve, reject) => {
    exec('sensors', function(error, stdout) {
      if (error) {
        return resolve('ERROR READING CPU');
      } else {
        let lines = stdout.toString().split('\n');
        lines.forEach(function (line) {
          let regex = /[+-]([^°]*)/g;
          let temps = line.match(regex);
          let firstPart = line.split(':')[0].toUpperCase();
          if (firstPart.indexOf('TDIE') !== -1) {
            return resolve(parseFloat(temps[0]))
          }
        });
      }
    })
  })
}