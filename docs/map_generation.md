## INSTRUCTIONS FOR MAP GENERATION

Prerequisites: Olympus v1.0.4 or newer must be installed in the DCS instance that will be used to generate the maps. The Camera Control Plugin must be enabled. It is NOT required for Olympus to be running during the map generation process.

### Steps

1) Ensure you have the latest version of the repository;

2) Install Python version 3.12.x or newer;

3) Open a command console in the `scripts\python\map_generator` folder;

4) Install the necessary Python packages running the following command:
    ```
    pip install -r requirements.txt
    ```

5) Open the `configs\screen_properties.yml` file and edit it by add your computer monitor size. Note: this is the size of the physical screen;

If you want to run an existing configuration file, skip to step 10.

6) Create a new folder inside `configs\` and name it as you please. For clarity, in these example the folder will be called `test`;

7) Create a configuration yaml file inside the `test` folder and name it as you please. In these example the file will be called `config.yaml`. It is suggested to start from one of the provided configurations as reference.

8) The configuration file must contain the following fields:
```
{
  'output_directory': '.\test',                            
  'boundary_file': '.\configs\test\boundary.kml',           
  'zoom_factor': 0.5,
  'geo_width': 15.38
}
```

`output_directory`: location where the created files will be placed; <br>
`boundary_file`: KML file containing the area that the map will cover. See below for more information; <br>
`zoom_factor`: value between 0 and 1 that controls how zoomed the map will be. 1 means zoomed all the way out, 0 means zoomed all the way in; <br>
`geo_width`: [optional] Size of the screen in nautical miles at the provided zoom level. See below for more details;

9) Create a boundary file. It is suggested to use Google Earth Pro or similar. Generate one or more polygons that encircle the area or areas you want to cover with the map and save them in a single .kml file. No specific naming or other requirements are present. From the example above the name would be `.\configs\test\boundary.kml`;

10) Start DCS. Start a mission in the correct theater, then open the F10 map. DCS must be running on your primary monitor (check your Windows screen settings);

10) Open a command console in the `scripts\python\map_generator` folder and run the following command, replacing the config file location with yours:
    ```
    python main.py .\configs\test\config.yml
    ```

11) The script will run, showing the loaded configuration and some computed values. If the `geo_width` value from step 8 is not provided in the configuration, the script will require you to enter it now. This value is computed by using the DCS F10 map measuring tool. Using the tool, measure the width of the screen, from end to end, in nautical miles. The script will automatically configure DCS in the correct state to do this.

12) The script will compute the number of screenshots that will be taken and will ask for confirmation. Unless you have multiple screens, it is suggested to resize the console to be very small and tuck it on the upper or lower edge of the screen. It is paramount that no window covers the center of the screen. There is a 300px margin all around the screen that can be covered by other windows;

13) Press enter to start. Multiple progress bars will be shown along the process. Just wait and have a nice walk :) 

### Resuming computation

Currently the screenshots taking process can not be resumed. However, if you already run the screenshot process once, the script will ask you if you want to skip the screenshots and go directly to the tiles processing.




