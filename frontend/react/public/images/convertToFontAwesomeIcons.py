from svgpathtools import svg2paths2
import os
from glob import glob
import svgelements 

result = [y for x in os.walk(".") for y in glob(os.path.join(x[0], '*.svg'))]

with open(os.path.join("..", "..",  "src", "ui", "components", "olicons.tsx"), "w") as fp:
    fp.write('import { IconDefinition, IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";\n')
    for filename in result:
        try: 
            iconName = filename.replace(".", "").replace("\\", "_").removesuffix("svg")
            iconName = iconName.replace("-", "_")
            temp = iconName.split('_')
            iconName = temp[0] + ''.join(ele.capitalize() for ele in temp[1:])

            svg = svgelements.SVG.parse(filename)
            paths, attributes, svg_attributes = svg2paths2(filename)

            fp.write(f"export const ol{iconName}: IconDefinition = {{")
            fp.write(" icon: [")
            fp.write(f" {svg.implicit_width}, {svg.implicit_height}, [], \"\",")
            fp.write("\"")

            for path in paths:
                fp.write(path.d() + " ")

            fp.write("\"")
            fp.write("]")

            name = temp[0] + ''.join(ele.lower() + '-' for ele in temp[1:]).removesuffix('-')
            fp.write(f', iconName: "olympus-{name}" as IconName')
            fp.write(f', prefix: "fas" as IconPrefix')
            fp.write("}\n")
        except Exception as e:
            print(f"Failed to generate path for {iconName}: {e}")