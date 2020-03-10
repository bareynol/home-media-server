const hardware = require('./hardware.js');
const services = require('./services.js');
const formatters = require('./formatters.js');

async function getAllData() {
  const [hardwareData, servicesData] = await Promise.all([hardware.getAllHardwareData(), services.getAllServicesData()]);
  return {
    hardware: hardwareData,
    services: servicesData,
  }
}

module.exports = {
  getAllData,
  hardware,
  formatters,
  services,
}
