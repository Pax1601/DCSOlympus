set plugin-name=boilerplateplugin

mkdir .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%

copy .\\index.js .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%\\index.js
copy .\\plugin.json .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%\\plugin.json
copy .\\style.css .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%\\style.css


mkdir .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%\\images
copy .\\images\\*.* .\\..\\..\\..\\server\\public\\plugins\\%plugin-name%\\images\\