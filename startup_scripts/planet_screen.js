//JAVA CLASSES LOADING
const $PlanetsScreen = Java.loadClass("earth.terrarium.adastra.client.screens.PlanetsScreen")
const $AdAstraClientEvents = Java.loadClass("earth.terrarium.adastra.api.client.events.AdAstraClientEvents")
const $RenderSystem = Java.loadClass("com.mojang.blaze3d.systems.RenderSystem")
const $Tesselator = Java.loadClass("com.mojang.blaze3d.vertex.Tesselator")
const $VertexFormat = Java.loadClass("com.mojang.blaze3d.vertex.VertexFormat")
const $DefaultVertexFormat = Java.loadClass("com.mojang.blaze3d.vertex.DefaultVertexFormat")
const $Util = Java.loadClass("net.minecraft.Util")
const $Axis = Java.loadClass("com.mojang.math.Axis")
const $GameRenderer = Java.loadClass("net.minecraft.client.renderer.GameRenderer")

StartupEvents.init(event => {

  //LISTENERS CLEANER         ///Removes the original Ad Astra's screen system redenderers from the menu.
  const $SolarSystemListeners = $AdAstraClientEvents.__javaObject__.getDeclaredField("RENDER_SOLAR_SYSTEM_LISTENERS")

  $SolarSystemListeners.setAccessible(true)

  let solar_system_listeners = $SolarSystemListeners.get(null)

  solar_system_listeners.clear()
})

StartupEvents.postInit(event => {

  //TIME VARIABLES DECLARATION       //This is for calculating the relative time (delta). Used for the orbits.
  let solar_system_time = null

  let solar_system_last_time = null

  //GLOBAL JSON ARRAY       //Updated in the server script.
  global.solar_systems_jsons = []

  //RENDERING
  $AdAstraClientEvents.RenderSolarSystemEvent.register((graphics, solarSystem, width, height) => {  
  
    global.solar_systems_jsons.forEach(solar_system => {

      if(solar_system.id == String(solarSystem)) { //Tests if (the ID of some system) is equal to "solarSystem" (the value the listener gets when it tests to see which system the player clicked in the menu).

        //ORBIT CIRCLES    //Circles for the main object's orbits.
        let tessellator = $Tesselator.getInstance()

        let bufferBuilder = tessellator.getBuilder()

        let orbiting_objects = solar_system.orbiting_objects

        $RenderSystem.setShader(() => {return $GameRenderer.getPositionColorShader()})

        bufferBuilder.begin($VertexFormat.Mode.DEBUG_LINES, $DefaultVertexFormat.POSITION_COLOR)
      
        orbiting_objects.forEach(object => {
        
          $PlanetsScreen.drawCircle(bufferBuilder, width / 2, height / 2, 5 * object.distance, 75, Number(object.circle_color.replace("#", "0xff")) | 0)

        })

        tessellator.end()

        //PLANET GETTER   //Gets the dimension of the planet clicked in the menu.
        let $screen = Client.screen

        let $selectedPlanet = $screen.getClass().getDeclaredField("selectedPlanet")
        
        $selectedPlanet.setAccessible(true)
        
        let selected_planet = $selectedPlanet.get($screen)
      
        //SUN
        graphics.pose().pushPose()

        graphics.pose().translate(width / 2, height / 2, 0)
        
        graphics.blit(solar_system.sun_texture, solar_system.sun_size / -2, solar_system.sun_size / -2, 0, 0, solar_system.sun_size, solar_system.sun_size, solar_system.sun_size, solar_system.sun_size)
      
        // SUN SELECTED OVERLAY   //If, for some reason, you want to go to the sun.
        if(selected_planet != null && solar_system.sun_dimension == selected_planet.dimension().location().toString()){

          graphics.pose().scale(1.25, 1.25, 1)

          graphics.blit("ad_astra:textures/environment/planet_overlay.png", solar_system.sun_size / -2, solar_system.sun_size / -2, 0, 0, solar_system.sun_size, solar_system.sun_size, solar_system.sun_size, solar_system.sun_size)
        }

        graphics.pose().popPose()
      
        ////OBJECTS
        solar_system_time = $Util.getMillis() / 1000

        let delta = solar_system_time - (solar_system_last_time ?? solar_system_time)
        
        solar_system_last_time = solar_system_time

        orbiting_objects.forEach(object => {
        
          graphics.pose().pushPose()
        
          graphics.pose().translate(width / 2, height / 2, 0)

          if((object.position ?? 0) == 0){          //If was used here as just "??" was being inconsistent, with it sometimes returning 0 for the undefined value.

            object.position = 360 / object.time * 16        //This if condition (and the 16 here) is for making it so that the movement of everyone doesen't start aligned at point 0.
          }

          object.position += 360 / object.time * delta

          object.position %= 360

          if(object.postion == 0){         //This is a failsafe for the supposedly rare but possible condition where we would get a 0 here, which would make the upper condition returns true in the middle of rendering, making the object jump.

            object.position = 360
          }

          graphics.pose().mulPose($Axis.ZP.rotationDegrees(object.position))
        
          graphics.pose().translate(5 * object.distance, 0, 0)
        
          graphics.blit(object.texture, object.size / -2, object.size / -2, 0, 0, object.size, object.size, object.size, object.size)

          let object_pose = graphics.pose().last().pose()   // Saves the object pose for later use.

          //////EXTRA OBJECTS OR MOONS
          object.extra_objects.forEach(extra_object => {

            graphics.pose().last().pose().set(object_pose)
          
            //////EXTRA ORBIT CIRCLE
            graphics.pose().pushPose()
          
            $RenderSystem.setShader(() => {return $GameRenderer.getPositionColorShader()})
          
            bufferBuilder.begin($VertexFormat.Mode.DEBUG_LINES, $DefaultVertexFormat.POSITION_COLOR)

            $PlanetsScreen.drawCircle(bufferBuilder, object_pose.m30(), object_pose.m31(), 5 * extra_object.distance, 25, Number(extra_object.circle_color.replace("#", "0xff")) | 0)   ///Needs to use the same distance value as the moon
          
            tessellator.end()

            //////EXTRA OBJECT
          
            graphics.pose().pushPose()

            if((extra_object.position ?? 0) == 0){

              extra_object.position = 360 / extra_object.time * 16
            }

            extra_object.position += 360 / extra_object.time * delta

            extra_object.position %= 360

            if(extra_object.postion == 0){

              extra_object.position = 360
            }
          
            graphics.pose().mulPose($Axis.ZP.rotationDegrees(extra_object.position))
          
            graphics.pose().translate(5 * extra_object.distance, 0, 0)
          
            graphics.blit(extra_object.texture, extra_object.size / -2, extra_object.size / -2, 0, 0, extra_object.size, extra_object.size, extra_object.size, extra_object.size)
          
            //////EXTRA OBJECT SELECTED OVERLAY
            if(selected_planet != null && extra_object.dimension == selected_planet.dimension().location().toString()){
          
              graphics.pose().pushPose()

              graphics.pose().scale(1.25, 1.25, 1)

              graphics.blit("ad_astra:textures/environment/planet_overlay.png", extra_object.size / -2, extra_object.size / -2, 0, 0, extra_object.size, extra_object.size, extra_object.size, extra_object.size)

              graphics.pose().popPose()
            }

            graphics.pose().popPose()

            graphics.pose().popPose()
          })

          //// OBJECT SELECTED OVERLAY   // Is here at the end to avoid redering under the extra objects.
          if(selected_planet != null && object.dimension == selected_planet.dimension().location().toString()){

            graphics.pose().last().pose().set(object_pose)
          
            graphics.pose().pushPose()

            graphics.pose().scale(1.25, 1.25, 1)

            graphics.blit("ad_astra:textures/environment/planet_overlay.png", object.size / -2, object.size / -2, 0, 0, object.size, object.size, object.size, object.size)

            graphics.pose().popPose()
        
          }

          graphics.pose().popPose()

        })
      }
    })
  })
})
