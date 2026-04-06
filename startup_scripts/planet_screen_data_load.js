//JAVA CLASSES LOADING
const $AdAstraData = Java.loadClass("earth.terrarium.adastra.common.planets.AdAstraData")
const $AdAstraConfig = Java.loadClass("earth.terrarium.adastra.common.config.AdAstraConfig")

//JSON FINDER AND PARSER FUNCTION
function solar_systems_jsons_load(resourceManager){

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

  let namespaces = resourceManager.getNamespaces()

  let paths = []

  namespaces.forEach(namespace => {

    solar_systems_ids.forEach(solar_system => {

      if (solar_system.includes(namespace + ":")){

        paths.push(namespace + ":solar_systems/" + solar_system.replace(namespace + ":", "") + ".json")

      }
    })
  })

  paths.forEach(path => {
    
    let resource = resourceManager.getResource(path)

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

//JAVA CLASSES LOADING
const $MinecraftForge = Java.loadClass("net.minecraftforge.common.MinecraftForge")
const $AddReloadListenerEvent = Java.loadClass("net.minecraftforge.event.AddReloadListenerEvent")
const $Consumer = Java.loadClass("java.util.function.Consumer")
const $PreparableReloadListener = Java.loadClass("net.minecraft.server.packs.resources.PreparableReloadListener")
const $CompletableFuture = Java.loadClass("java.util.concurrent.CompletableFuture")
const $EventPriority = Java.loadClass("net.minecraftforge.eventbus.api.EventPriority")

//MAKESHIFT SERVER LOAD AND RELOAD EVENT
StartupEvents.init(event => {          //This is here for the lack of one in vanilla KJS, and apparent lack of funcioning repeating server events with KubePackages.

  $MinecraftForge.EVENT_BUS.addListener($EventPriority.NORMAL, false, $AddReloadListenerEvent, new JavaAdapter($Consumer, {

    accept: event => {

      event.addListener(new JavaAdapter($PreparableReloadListener, {

        m_5540_: (barrier, resourceManager, prepProfiler, applyProfiler, backgroundExecutor, gameExecutor) => {     //m_5540_ is the reload function.

          return $CompletableFuture

            .supplyAsync(() => {   //Can run code here, but not the function needed in this case.
          
              return null           //The returned value here is passed along to the next ones.
            }, backgroundExecutor)

            .thenCompose(result => barrier.wait(result))

            .thenAcceptAsync(result => {
          
              solar_systems_jsons_load(resourceManager)      //Needs to be ran here, or it won't work correctly. As for currently at least.
            }, gameExecutor)
        }
      }))
    }
  }))
})