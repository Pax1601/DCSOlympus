import argparse, json

def main():
    parser = argparse.ArgumentParser(
                prog='DCS Olympus configurator',
                description='This software allows to edit the DCS Olympus configuration file',
                epilog='')

    parser.add_argument('-a', '--address')
    parser.add_argument('-c', '--clientPort')
    parser.add_argument('-b', '--backendPort')
    parser.add_argument('-p', '--password')
    parser.add_argument('-bp', '--bluePassword')
    parser.add_argument('-rp', '--redPassword')

    args = parser.parse_args()

    with open("olympus.json", "r") as fp:
        config = json.load(fp)

    if (args.address is not None):
        config["server"]["address"] = args.address
        print(f"Address set to {args.address}")
    else:
        print("No address provided, skipping...")

    if args.backendPort is not None:
        if args.backendPort.isdecimal():
            config["server"]["port"] = int(args.backendPort)
            print(f"Backend port set to {args.backendPort}")
        else:
            print(f"Invalid backend port provided {args.backendPort}")
    else:
        print("No backend port provided, skipping...")

    if (args.password is not None):
        config["authentication"]["gameMasterPassword"] = args.password
        print(f"Game Master password set to {args.password}")
    else:
        print("No Game Master password provided, skipping...")

    if (args.bluePassword is not None):
        config["authentication"]["blueCommanderPassword"] = args.bluePassword
        print(f"Blue Commander password set to {args.bluePassword}")
    else:
        print("No Blue Commander password provided, skipping...")

    if (args.redPassword is not None):
        config["authentication"]["redCommanderPassword"] = args.redPassword
        print(f"Red Commander password set to {args.redPassword}")
    else:
        print("No Red Commander password provided, skipping...")

    if args.clientPort is not None:
        if args.clientPort.isdecimal():
            config["client"]["port"] = int(args.clientPort)
            print(f"Client port set to {args.clientPort}")
        else:
            print(f"Invalid client port provided {args.clientPort}")
    else:
        print("No client port provided, skipping...")

    with open("olympus.json", "w") as fp:
        json.dump(config, fp, indent = 4)

if __name__ == "__main__":
    main()