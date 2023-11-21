import argparse, json
import PySimpleGUI as sg
import hashlib

# Apply the values to the olympus.json config file
def apply_values(args):
    with open("olympus.json", "r") as fp:
        config = json.load(fp)

    if args.address is not None and args.address != "":
        config["server"]["address"] = args.address
        print(f"Address set to {args.address}")
    else:
        print("No address provided, skipping...")

    if args.backendPort is not None and args.backendPort != "":
        # The backend port must be a numerical value
        if args.backendPort.isdecimal():
            config["server"]["port"] = int(args.backendPort)
            print(f"Backend port set to {args.backendPort}")
        else:
            print(f"Invalid backend port provided: {args.backendPort}")
    else:
        print("No backend port provided, skipping...")

    if args.clientPort is not None and args.clientPort != "":
         # The client port must be a numerical value
        if args.clientPort.isdecimal():
            config["client"]["port"] = int(args.clientPort)
            print(f"Client port set to {args.clientPort}")
        else:
            print(f"Invalid client port provided: {args.clientPort}")
    else:
        print("No client port provided, skipping...")

    if args.password is not None and args.password != "":
        config["authentication"]["gameMasterPassword"] = hashlib.sha256(args.password.encode()).hexdigest()
        print(f"Game Master password set to {args.password}")
    else:
        print("No Game Master password provided, skipping...")

    if args.bluePassword is not None and args.bluePassword != "":
        config["authentication"]["blueCommanderPassword"] = hashlib.sha256(args.bluePassword.encode()).hexdigest()
        print(f"Blue Commander password set to {args.bluePassword}")
    else:
        print("No Blue Commander password provided, skipping...")

    if args.redPassword is not None and args.redPassword != "":
        config["authentication"]["redCommanderPassword"] = hashlib.sha256(args.redPassword.encode()).hexdigest()
        print(f"Red Commander password set to {args.redPassword}")
    else:
        print("No Red Commander password provided, skipping...")

    with open("olympus.json", "w") as fp:
        json.dump(config, fp, indent = 4)

def main():
    # Parse the input arguments
    parser = argparse.ArgumentParser(
                prog="DCS Olympus configurator",
                description="This software allows to edit the DCS Olympus configuration file",
                epilog="")

    parser.add_argument("-a", "--address")
    parser.add_argument("-c", "--clientPort")
    parser.add_argument("-b", "--backendPort")
    parser.add_argument("-p", "--password")
    parser.add_argument("-bp", "--bluePassword")
    parser.add_argument("-rp", "--redPassword")

    args = parser.parse_args()

    # If no argument was provided, start the GUI
    if args.address is None and \
        args.backendPort is None and \
        args.clientPort is None and \
        args.password is None and \
        args.bluePassword is None and \
        args.redPassword is None:
        print(f"No arguments provided, starting in graphical mode")

        with open("olympus.json", "r") as fp:
            config = json.load(fp)

        old_values = {}
        window = sg.Window("DCS Olympus configurator",
        [[sg.T("DCS Olympus configurator", font=("Helvetica", 14, "bold")), sg.Push(), sg.Image(".\\img\\configurator_logo.png", size = (50, 50))],
         [sg.T("")],
         [sg.T("Address"), sg.Push(), sg.In(size=(30, 10), default_text=config["server"]["address"], key="address")],
         [sg.T("Webserver port"), sg.Push(), sg.In(size=(30, 10), default_text=config["client"]["port"], key="clientPort", enable_events=True)],
         [sg.T("Backend port"), sg.Push(), sg.In(size=(30, 10), default_text=config["server"]["port"], key="backendPort", enable_events=True)],
         [sg.T("Game Master password"), sg.Push(), sg.In(size=(30, 10), password_char="*", key="password")],
         [sg.T("Blue Commander password"), sg.Push(), sg.In(size=(30, 10), password_char="*", key="bluePassword")],
         [sg.T("Red Commander password"), sg.Push(), sg.In(size=(30, 10), password_char="*", key="redPassword")],
         [sg.T("Note: Empty fields will retain their original values")],
         [sg.T("")],
         [sg.B("Apply"), sg.B("Exit"), sg.T("Remember to restart DCS Server and any running mission", font=("Helvetica", 10, "bold"))]],
         icon = ".\\img\\olympus_configurator.ico")
        
        while True:
            event, values = window.read()

            # The backend and client ports must be numerical. Enforce it.
            if event == "backendPort":
                if values["backendPort"].isdecimal() or values["backendPort"] == "":
                    old_values["backendPort"] = values["backendPort"]
                else:
                    window["backendPort"].update(old_values["backendPort"] if "backendPort" in old_values else config["server"]["port"])

            if event == "clientPort":
                if values["clientPort"].isdecimal() or values["clientPort"] == "":
                    old_values["clientPort"] = values["clientPort"]
                else:
                    window["clientPort"].update(old_values["clientPort"] if "clientPort" in old_values else config["client"]["port"])

            # Update the config file
            if event == "Apply":
                args.address = values["address"]
                args.backendPort = values["backendPort"]
                args.clientPort = values["clientPort"]
                args.password = values["password"]
                args.bluePassword = values["bluePassword"]
                args.redPassword = values["redPassword"]
                apply_values(args)
                sg.Popup("DCS Olympus configuration updated")

            if event == sg.WIN_CLOSED or event == "Exit":
                window.close()
                break

    # If any argument was provided, run in headless mode
    else:
        apply_values(args)

if __name__ == "__main__":
    main()