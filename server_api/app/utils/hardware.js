const si = require('systeminformation');
const exec = require('child_process').exec;
const {prettySize, roundToTwoDecimals} = require('./formatters.js');

async function getAllHardwareData() {
  const [cpu, disk, mem, uptime] = await Promise.all(
    [
      getCpuData(),
      getDiskData(),
      getMemData(),
      getUptime()
    ]
  );

  return {
    cpu,
    disk,
    mem,
    uptime
  }
}

/**
 * 
 * CPU FUNCTIONS
 * 
 **/

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


/**
 * 
 * DISKS FUNCTIONS
 * 
 **/

// constant definition for mapping the drives
const DRIVE_MAP = [
  ["SSD", "/dev/sdb2"],
  ["TV", "/dev/sda1"],
]

function getDriveLabel(diskName) {
  /**
   * Return the label from the drive map if the
   * diskName given matches. Else return False
   */
  for(var i = 0; i < DRIVE_MAP.length; i++) {
    if (diskName === DRIVE_MAP[i][1]) {
      return DRIVE_MAP[i][0]
    }
  }
  return false
}

async function getDiskData() {
  const [storage] = await Promise.all([getDiskStorage()]);

  return storage;
}

async function getDiskStorage() {
  const fsSize = await si.fsSize();
  const disks = [];
  fsSize.forEach(disk => {
    const driveLabel = getDriveLabel(disk.fs);
    if (driveLabel) {
      disks.push({
        label: driveLabel,
        size: prettySize(disk.size),
        used: prettySize(disk.used),
        percentUsed: disk.use,
      })
    }
  })

  return disks;
}

/**
 * 
 * MISC DATA FUNCTIONS
 * 
 */

 async function getMemData() {
   const mem = await si.mem();
   return {
     total: prettySize(mem.total),
     active: prettySize(mem.active),
     available: prettySize(mem.available),
     percentUsed: roundToTwoDecimals(100 * (mem.active / mem.total)),
   }
 }

 async function getUptime() {
   /**
    * returns server uptime in seconds
    */
   const siTime = await si.time();
   return siTime.uptime
 }


module.exports = {
  getAllHardwareData,
  getCpuData,
  getCpuTemperature,
  getDiskData,
  getDiskStorage,
  getMemData,
  getUptime,
};
