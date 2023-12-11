// configurator.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <fstream>
#include <nlohmann/json.hpp>
#include "argparse/argparse.hpp"
#include "sha256.h"
#include "windows.h"
#include <chrono>
#include <thread>


using json = nlohmann::json;
using namespace std;

struct MyArgs : public argparse::Args {
    string& address = kwarg("a", "Address");
    int& clientPort = kwarg("c", "Client port");
    int& backendPort = kwarg("b", "Backend port");
    string& gameMasterPassword = kwarg("p", "Game master password");
    string& blueCommanderPassword = kwarg("bp", "Blue commander password");
    string& redCommanderPassword = kwarg("rp", "Red commander password");
};

void SetStdinEcho(bool enable = true)
{
    HANDLE hStdin = GetStdHandle(STD_INPUT_HANDLE);
    DWORD mode;
    GetConsoleMode(hStdin, &mode);

    if (!enable)
        mode &= ~ENABLE_ECHO_INPUT;
    else
        mode |= ENABLE_ECHO_INPUT;

    SetConsoleMode(hStdin, mode);
}

int main(int argc, char* argv[]) 
{
    cout << "DCS Olympus configurator v1.0.0" << endl << endl << endl;

    SHA256 sha256;

    std::ifstream f("olympus.json");
    json data = json::parse(f);

    string address = data["server"]["address"];
    int clientPort = data["client"]["port"];
    int backendPort = data["server"]["port"];
    string gameMasterPassword = data["authentication"]["gameMasterPassword"];
    string blueCommanderPassword = data["authentication"]["blueCommanderPassword"];
    string redCommanderPassword = data["authentication"]["redCommanderPassword"];

    if (argc > 1) {
        auto args = argparse::parse<MyArgs>(argc, argv);
        args.print();      // prints all variables

        address = args.address;
        clientPort = args.clientPort;
        backendPort = args.backendPort;
        gameMasterPassword = sha256(args.gameMasterPassword);
        blueCommanderPassword = sha256(args.blueCommanderPassword);
        redCommanderPassword = sha256(args.redCommanderPassword);

    } else {
        cout << "No arguments provided, running in interactive mode" << endl;

        SetStdinEcho(true);

        string newValue;

        cout << "Insert a new address or press Enter to keep current value: " << address << endl << ">";
        getline(cin, newValue);
        if (newValue != "")
            address = newValue;

        while (true) {
            cout << "Insert a new client port or press Enter to keep current value: " << clientPort << endl << ">";
            getline(cin, newValue);
            if (newValue != "") {
                try {
                    clientPort = stoi(newValue);
                    break;
                }
                catch (...) {
                    cout << "Insert a valid integer number" << endl;
                }
            }
            else {
                break;
            }
        }

        while (true) {
            cout << "Insert a new backend port or press Enter to keep current value: " << backendPort << endl << ">";
            getline(cin, newValue);
            if (newValue != "") {
                try {
                    backendPort = stoi(newValue);
                    break;
                }
                catch (...) {
                    cout << "Insert a valid integer number" << endl;
                }
            }
            else {
                break;
            }
        };

        SetStdinEcho(false);

        while (true) {
            cout << "Insert a new Game Master password" << endl << ">";
            getline(cin, newValue);
            cout << endl;
            if (newValue != "") {
                gameMasterPassword = sha256(newValue);
                break;
            }
            else {
                cout << "Value can't be empty" << endl;
            }
        }

        while (true) {
            cout << "Insert a new Blue Commander password" << endl << ">";
            getline(cin, newValue);
            cout << endl;
            if (newValue != "") {
                blueCommanderPassword = sha256(newValue);
                break;
            }
            else {
                cout << "Value can't be empty" << endl;
            }
        }

        while (true) {
            cout << "Insert a new Red Commander password" << endl << ">";
            getline(cin, newValue);
            cout << endl;
            if (newValue != "") {
                redCommanderPassword = sha256(newValue);
                break;
            }
            else {
                cout << "Value can't be empty" << endl;
            }
        }
    }

    data["server"]["address"] = address;
    data["server"]["port"] = backendPort;
    data["authentication"]["gameMasterPassword"] = gameMasterPassword;
    data["authentication"]["blueCommanderPassword"] = blueCommanderPassword;
    data["authentication"]["redCommanderPassword"] = redCommanderPassword;
    data["client"]["port"] = clientPort;

    std::ofstream o("olympus.json");
    o << std::setw(4) << data << std::endl;

    cout << endl;
    cout << "Configuration updated successfully, bye!" << endl;

    this_thread::sleep_for(chrono::milliseconds(2000));
}

