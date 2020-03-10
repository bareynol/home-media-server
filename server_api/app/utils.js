const si = require('systeminformation');
const exec = require('child_process').exec;

async function getCpuData() {
  const [temperature] = await Promise.all([getCpuTemperature()]);

  return {
    temperature
  }
}


async function getCpuTemperature() {
  /**
   * CPU is an AMD Ryzen 5 2600 X
   * `systeminformation` package is not compatible with this CPU for temperature
   * 
   * `lm-sensors` on ubuntu exposes the `sensors` command which outputs the following:
   * 
    k10temp-pci-00c3
    Adapter: PCI adapter
    Tdie:         +34.4°C  (high = +70.0°C)
    Tctl:         +34.4°C  
   * 
   * "Tdie" is the current CPU temperature for this CPU.
   * This function executes the `sensors` commands and parses for that value
   * **/

  return new Promise((resolve, reject) => {
    // execute the sensors command
    exec('sensors', function(error, stdout) {
      if (error) {
        return resolve('ERROR READING CPU');
      } else {
        // split the output of sensors by line
        let lines = stdout.toString().split('\n');
        lines.forEach(function (line) {
          let regex = /[+-]([^°]*)/g;     // match a temperature
          let temps = line.match(regex);  // array of temperatures on the line
          let firstPart = line.split(':')[0].toUpperCase();
          if (firstPart.indexOf('TDIE') !== -1) {   // only care about "TDIE" line
            return resolve(parseFloat(temps[0]))  // use temps[0], the first temperature on the line. 
          }
        });
      }
    })
  })
}

module.exports = {
  getCpuData,
  getCpuTemperature,
};
