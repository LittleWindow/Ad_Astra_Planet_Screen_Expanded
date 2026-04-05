const $AdAstraData = Java.loadClass("earth.terrarium.adastra.common.planets.AdAstraData")
const $AdAstraConfig = Java.loadClass("earth.terrarium.adastra.common.config.AdAstraConfig")

function solar_systems_jsons_load(){

  global.solar_systems_jsons = []

  let planets = $AdAstraData.planets().values().stream()
  .filter(planet => !$AdAstraConfig.disabledPlanets.contains(planet.dimension().location()))
  .filter(planet => !planet.dimension().location().toString().includes("_orbit"))
  .toList()

  let solar_systems_ids = []

  planets.forEach(planet => {

    if(!solar_systems_ids.includes(planet.solarSystem().toString())) {

      solar_systems_ids.push(planet.solarSystem().toString())

    }
    
  })

  let namespaces = Utils.getServer().getResourceManager().getNamespaces()

  let paths = []

  namespaces.forEach(namespace => {

    solar_systems_ids.forEach(solar_system => {

      if (solar_system.includes(namespace + ":")){

        paths.push(namespace + ":solar_systems/" + solar_system.replace(namespace + ":", "") + ".json")

      }
    })
  })

  paths.forEach(path => {
    
    let resource = Utils.getServer().getResourceManager().getResource(path)

    if(resource.isPresent()){

      let line = 0

      let content = ""

      let read_resource = resource.get().openAsReader()

      while((line = read_resource.readLine()) != null){

        content += line

      }

      try{

        let json = JSON.parse(content)
    
        global.solar_systems_jsons.push(json)

      } catch(error){

        console.log("Failed to load .json file in path: " + path)

      }

    } else{

      console.log("Not found .json file in path: " + path)

    }
  })
}

ServerEvents.loaded(event => {    //Runs when the servers opens.

  solar_systems_jsons_load()
  
})

ServerEvents.lowPriorityData(event => {    //Runs at the end of data loading, to make sure the planets jsons are properly loaded.

  if(Utils.getServer() != null){           //Will return true only after the first load, in reloads.
    
    solar_systems_jsons_load()

  }
})
