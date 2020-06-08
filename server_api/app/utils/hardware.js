const si = require('systeminformation');
const exec = require('child_process').exec;
const {prettySize, roundToTwoDecimals} = require('./formatters.js');
const fetch = require('node-fetch');

async function getAllHardwareData() {
  const [cpu, disks, mem, uptime] = await Promise.all(
    [
      getCpuData(),
      getDiskData(),
      getMemData(),
      getUptime()
    ]
  );

  return {
    cpu,
    disks,
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
const DISK_LABELS = {
  "/dev/sdb2": "SSD",
  "/dev/sdc": "TV",
  "/dev/sda1": "Movies",
}

async function getDiskData() {
  const [disks, tvSeries, movies] = await Promise.all([getDisks(), getTVSeries(), getMovies()]);
  console.log(movies)

  for (let i=0; i < disks.length; i++) {
    if (disks[i] && disks[i].label == "TV") {
      disks[i].data = tvSeries;
    }
    if (disks[i] && disks[i].label == "Movies") {
      disks[i].data = movies;
    }
  }


  return disks;
}

async function getDisks() {
  const fsSize = await si.fsSize();
  const disks = [];
  fsSize.forEach(disk => {
    console.log(disk)
    const diskLabel = DISK_LABELS[disk.fs];
    if (diskLabel) { // exclude disks not in DRIVE_MAP
      disks.push({
        label: diskLabel,
        size: disk.size,
        used: disk.used,
        percentUsed: disk.use,
      })
    }
  })

  return disks;
}

async function getTVSeries() {
  /**
   * use sonarr API to get the disk space
   * usage for each TV series
   * 
   * return list of series sorted by descending disk usage
   */
  const sonarrUrl = "http://192.168.0.22:8989";
  const apiKey = process.env.SONARR_API_KEY;

  const series_data = await fetch(`${sonarrUrl}/api/series?apikey=${apiKey}`).then(response => response.json());
  
  if (!series_data) return []

  // this should be lodash lol
  return series_data.sort((a,b) => a.sizeOnDisk > b.sizeOnDisk ? -1 : a.sizeOnDisk < b.sizeOnDisk ? 1 : 0)
}

async function getMovies() {
  /**
   * use sonarr API to get the disk space
   * usage for each TV series
   * 
   * return list of series sorted by descending disk usage
   */
  const radarrUrl = "http://192.168.0.22:7878";
  const apiKey = process.env.RADARR_API_KEY;

  const movies = await fetch(`${radarrUrl}/api/movie?apikey=${apiKey}`).then(response => response.json());
  
  if (!movies) return []

  // this should be lodash lol
  return movies.sort((a,b) => a.sizeOnDisk > b.sizeOnDisk ? -1 : a.sizeOnDisk < b.sizeOnDisk ? 1 : 0)
}

/**
 * 
 * MISC DATA FUNCTIONS
 * 
 */

 async function getMemData() {
   const mem = await si.mem();
   return {
     total: mem.total,
     active: mem.active,
     available: mem.available,
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
  getDisks,
  getMemData,
  getUptime,
};
