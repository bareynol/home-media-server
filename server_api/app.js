const express = require('express');
const si = require('systeminformation');
const exec = require('child_process').exec;
const app = express()
const port = 3000


app.get('/', (req, res) => res.send('Hello World!'))
app.get('/cpu', (req, res) => {
  console.log("cpu temp:", getCpuTemperature());
  res.send('CPU')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

async function getCpuTemperature() {
  return exec('sensors', function(error, stdout) {
    if (error) {
      return ('ERROR READING CPU');
    } else {
      let lines = stdout.toString().split('\n');
      lines.forEach(function (line) {
        let regex = /[+-]([^°]*)/g;
        let temps = line.match(regex);
        let firstPart = line.split(':')[0].toUpperCase();
        if (firstPart.indexOf('TDIE') !== -1) {
          return parseFloat(temps[0])
        }
      });
    }
  })
}