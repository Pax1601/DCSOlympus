//  This is saved here in case it's needed again
//  It converts the info outputted from the Python script and tweaks it a bit

const data = {
    "airfields": {
      "Abu_Dhabi_International_Airport": {
        "ICAO": "OMAA",
        "Elevation": "92",
        "TACAN": "",
        "Runways": {
          "13L": {
            "magHeading": "127",
            "Length": "13100",
            "ILS": ""
          },
          "13R": {
            "magHeading": "127",
            "Length": "13200",
            "ILS": ""
          },
          "31L": {
            "magHeading": "307",
            "Length": "13100",
            "ILS": ""
          },
          "31R": {
            "magHeading": "307",
            "Length": "13200",
            "ILS": ""
          }
        }
      },
      "Ai_Ain_International_Airport": {
        "ICAO": "OMAL",
        "Elevation": "814",
        "TACAN": "",
        "Runways": {
          "01": {
            "magHeading": "006",
            "Length": "12800",
            "ILS": ""
          },
          "19": {
            "magHeading": "186",
            "Length": "12800",
            "ILS": ""
          }
        }
      },
      "abu_musa_airport": {
        "ICAO": "OIBA",
        "Elevation": "16",
        "TACAN": "",
        "Runways": {
          "08": {
            "magHeading": "082",
            "Length": "7800",
            "ILS": ""
          },
          "26": {
            "magHeading": "262",
            "Length": "7800",
            "ILS": ""
          }
        }  
      },
      "Dhafra_AFB": {
        "ICAO": "OMAM",
        "Elevation": "52",
        "TACAN": "96X",
        "Runways": {
          "13L": {
            "magHeading": "126",
            "Length": "11700",
            "ILS": "111.10"
          },
          "31R": {
            "magHeading": "306",
            "Length": "11700",
            "ILS": "109.10"
          },
          "13R": {
            "magHeading": "16",
            "Length": "11700",
            "ILS": "108.70"
          },
          "31L": {
            "magHeading": "306",
            "Length": "11700",
            "ILS": "108.70"
          }
        }  
      },
      "Al_Maktoum_International_Airport": {
        "ICAO": "OMDW",
        "Elevation": "125",
        "TACAN": "",
        "Runways": {
          "12": {
            "magHeading": "120",
            "Length": "14400",
            "ILS": "111.75"
          },
          "30": {
            "magHeading": "300",
            "Length": "14400",
            "ILS": "109.75"
          }
        }  
      },
      "Minhad_AFB": {
        "ICAO": "OMDM",
        "Elevation": "190",
        "TACAN": "99X",
        "Runways": {
          "09": {
            "magHeading": "088",
            "Length": "12600",
            "ILS": "110.70"
          },
          "27": {
            "magHeading": "268",
            "Length": "12600",
            "ILS": "110.75"
          }
        }  
      },
      "Al_Bateen_Airport": {
        "ICAO": "OMAD",
        "Elevation": "12",
        "TACAN": "",
        "Runways": {
          "13": {
            "magHeading": "127",
            "Length": "7000",
            "ILS": ""
          },
          "31": {
            "magHeading": "307",
            "Length": "7000",
            "ILS": ""
          }
        }  
      },
      "Bandar_Abbas_airfield": {
        "ICAO": "OIKB",
        "Elevation": "29",
        "TACAN": "78X",
        "Runways": {
          "03L": {
            "magHeading": "25",
            "Length": "11000",
            "ILS": ""
          },
          "21R": {
            "magHeading": "205",
            "Length": "10000",
            "ILS": ""
          },
          "03R": {
            "magHeading": "25",
            "Length": "11700",
            "ILS": ""
          },
          "21L": {
            "magHeading": "205",
            "Length": "11700",
            "ILS": "109.90"
          }
        }  
      },
      "Bandar_Lengeh_Airport": {
        "ICAO": "OIBL",
        "Elevation": "82",
        "TACAN": "",
        "Runways": {
          "08": {
            "magHeading": "079",
            "Length": "7900",
            "ILS": ""
          },
          "26": {
            "magHeading": "259",
            "Length": "7900",
            "ILS": ""
          }
        }  
      },
      "Bandar_e_Jask_airfield": {
        "ICAO": "OIZJ",
        "Elevation": "26",
        "TACAN": "110X",
        "Runways": {
          "06": {
            "magHeading": "059",
            "Length": "7300",
            "ILS": ""
          },
          "24": {
            "magHeading": "239",
            "Length": "7300",
            "ILS": ""
          }
        }  
      },
      "Dubai_International_Airport": {
        "ICAO": "OMDB",
        "Elevation": "16",
        "TACAN": "",
        "Runways": {
          "12L": {
            "magHeading": "120",
            "Length": "11400",
            "ILS": "110.10"
          },
          "30R": {
            "magHeading": "300",
            "Length": "11400",
            "ILS": "110.90"
          },
          "12R": {
            "magHeading": "120",
            "Length": "11400",
            "ILS": "109.50"
          },
          "30L": {
            "magHeading": "300",
            "Length": "11400",
            "ILS": "111.30"
          }
        }  
      },
      "Fujarirah_AFB": {
        "ICAO": "OMFJ",
        "Elevation": "121",
        "TACAN": "",
        "Runways": {
          "11": {
            "magHeading": "111",
            "Length": "9700",
            "ILS": ""
          },
          "29": {
            "magHeading": "291",
            "Length": "9700",
            "ILS": "111.50"
          }
        }  
      },
      "Havadarya_AFB": {
        "ICAO": "OIKP",
        "Elevation": "52",
        "TACAN": "47X",
        "Runways": {
          "08": {
            "magHeading": "077",
            "Length": "7200",
            "ILS": "108.90"
          },
          "26": {
            "magHeading": "257",
            "Length": "7200",
            "ILS": ""
          }
        }  
      },
      "Jiroft_airfield": {
        "ICAO": "OIKJ",
        "Elevation": "2664",
        "TACAN": "",
        "Runways": {
          "13": {
            "magHeading": "125",
            "Length": "9600",
            "ILS": ""
          },
          "31": {
            "magHeading": "305",
            "Length": "9600",
            "ILS": ""
          }
        }  
      },
      "Kerman_AFB": {
        "ICAO": "OIKK",
        "Elevation": "5745",
        "TACAN": "97X",
        "Runways": {
          "16": {
            "magHeading": "155",
            "Length": "12400",
            "ILS": ""
          },
          "34": {
            "magHeading": "335",
            "Length": "12400",
            "ILS": ""
          }
        }  
      },
      "Khasab_AFB": {
        "ICAO": "OOKB",
        "Elevation": "102",
        "TACAN": "",
        "Runways": {
          "01": {
            "magHeading": "012",
            "Length": "8000",
            "ILS": ""
          },
          "19": {
            "magHeading": "192",
            "Length": "8000",
            "ILS": "110.30"
          }
        }  
      },
      "Kish_International_Airport": {
        "ICAO": "OIBK",
        "Elevation": "115",
        "TACAN": "112X",
        "Runways": {
          "10": {
            "magHeading": "094",
            "Length": "11700",
            "ILS": ""
          },
          "28": {
            "magHeading": "274",
            "Length": "11700",
            "ILS": ""
          },
          "09R": {
            "magHeading": "094",
            "Length": "11700",
            "ILS": ""
          },
          "27L": {
            "magHeading": "274",
            "Length": "11700",
            "ILS": ""
          }
        }  
      },
      "Lar_airbase": {
        "ICAO": "OISL",
        "Elevation": "2635",
        "TACAN": "",
        "Runways": {
          "09": {
            "magHeading": "088",
            "Length": "10100",
            "ILS": ""
          },
          "27": {
            "magHeading": "268",
            "Length": "10100",
            "ILS": ""
          }
        }  
      },
      "Lavan_Island_Airport": {
        "ICAO": "OIBV",
        "Elevation": "75",
        "TACAN": "",
        "Runways": {
          "11": {
            "magHeading": "110",
            "Length": "8600",
            "ILS": ""
          },
          "29": {
            "magHeading": "290",
            "Length": "8600",
            "ILS": ""
          }
        }  
      },
      "Liwa_Airbase": {
        "ICAO": "OMLW",
        "Elevation": "400",
        "TACAN": "121X",
        "Runways": {
          "13": {
            "magHeading": "130",
            "Length": "11600",
            "ILS": ""
          },
          "31": {
            "magHeading": "310",
            "Length": "11600",
            "ILS": ""
          }
        }  
      },
      "Qeshm_Airport": {
        "ICAO": "OIKQ",
        "Elevation": "26",
        "TACAN": "",
        "Runways": {
          "05": {
            "magHeading": "047",
            "Length": "13600",
            "ILS": ""
          },
          "23": {
            "magHeading": "227",
            "Length": "13600",
            "ILS": ""
          }
        }  
      },
      "Ras_Ai_Khaimah_International_Airport": {
        "ICAO": "OMRK",
        "Elevation": "330",
        "TACAN": "",
        "Runways": {
          "17": {
            "magHeading": "163",
            "Length": "12000",
            "ILS": ""
          },
          "35": {
            "magHeading": "343",
            "Length": "12000",
            "ILS": ""
          }
        }  
      },
      "Sas_Ai_Nakheel_Airport": {
        "ICAO": "OMNK",
        "Elevation": "10",
        "TACAN": "",
        "Runways": {
          "16": {
            "magHeading": "160",
            "Length": "6000",
            "ILS": ""
          },
          "34": {
            "magHeading": "340",
            "Length": "6000",
            "ILS": ""
          }
        }  
      },
      "Sharjah_International_Airport": {
        "ICAO": "OMSJ",
        "Elevation": "26",
        "TACAN": "",
        "Runways": {
          "12L": {
            "magHeading": "121",
            "Length": "10500",
            "ILS": "108.55"
          },
          "30R": {
            "magHeading": "301",
            "Length": "10500",
            "ILS": "111.95"
          },
          "12R": {
            "magHeading": "121",
            "Length": "10500",
            "ILS": ""
          },
          "30L": {
            "magHeading": "301",
            "Length": "10500",
            "ILS": ""
          }
        }  
      },
      "Shiraz_AFB": {
        "ICAO": "OISS",
        "Elevation": "4879",
        "TACAN": "94X",
        "Runways": {
          "11L": {
            "magHeading": "113",
            "Length": "14000",
            "ILS": ""
          },
          "29R": {
            "magHeading": "293",
            "Length": "14000",
            "ILS": ""
          },
          "11R": {
            "magHeading": "113",
            "Length": "13800",
            "ILS": ""
          },
          "29L": {
            "magHeading": "293",
            "Length": "13800",
            "ILS": "108.50"
          }
        }  
      },
      "Sir_Abu_Nuayr": {
        "ICAO": "OMSN",
        "Elevation": "26",
        "TACAN": "",
        "Runways": {
          "10": {
            "magHeading": "097",
            "Length": "2300",
            "ILS": ""
          },
          "28": {
            "magHeading": "277",
            "Length": "2300",
            "ILS": ""
          }
        }  
      },
      "Sirri_Island_AFB": {
        "ICAO": "OIBS",
        "Elevation": "20",
        "TACAN": "",
        "Runways": {
          "12": {
            "magHeading": "125",
            "Length": "7900",
            "ILS": ""
          },
          "30": {
            "magHeading": "305",
            "Length": "7900",
            "ILS": ""
          }
        }  
      },
      "Tunb_Islab_AFB": {
        "ICAO": "OIGI",
        "Elevation": "43",
        "TACAN": "",
        "Runways": {
          "03": {
            "magHeading": "025",
            "Length": "6200",
            "ILS": ""
          },
          "21": {
            "magHeading": "205",
            "Length": "6200",
            "ILS": ""
          }
        }  
      },
      "Tonb_e_Kochak_Airport": {
        "ICAO": "OITK",
        "Elevation": "16",
        "TACAN": "89X",
        "Runways": {
          "08": {
            "magHeading": "079",
            "Length": "2500",
            "ILS": ""
          },
          "26": {
            "magHeading": "259",
            "Length": "2500",
            "ILS": ""
          }
        }  
      }
    }
}; 

let airfields = data.airfields;

Object.keys( airfields ).forEach( name => {

    const airfield = airfields[ name ];

    const newRunways = [];
    const Runways    = airfield.Runways; 

    function createHeadings( runway, heading1, data1, heading2, data2 ) {
        const headings = {};

        headings[ arguments[1] ] = arguments[2];
        headings[ arguments[3] ] = arguments[4];
    
        runway.length = Runways[ arguments[1] ].Length;

        delete Runways[ arguments[1] ].Length;
        delete Runways[ arguments[3] ].Length;

        return headings;
    }

    function createRunway() {
        return {
            "headings": [],
            "length": ""
        }
    }

    function getReciprocal( hdg ) {

        const matches     = hdg.match( /^(\d{2})(\w?)$/ );
        const degrees     = parseInt( matches[1] + "0" );
        const lr          = ( matches[2] ) ? ( matches[2] === "L" ) ? "R" : "L" : "";
        const reciprocal  = ( degrees <= 180 ) ? degrees + 180 : degrees - 180;
        const leadingZero = ( reciprocal < 100 ) ? "0" : "";

        return `${leadingZero}${reciprocal/10}${lr}`;
        
    }

    let headings = Object.keys( Runways );
    let limit    = 0;       //  Safety net

    while ( headings.length > 0 && limit++ < 20 ) {

        let runway = createRunway();
        let h0     = headings.shift();
        let reciprocal;

        if ( headings.length === 1 ) {
            reciprocal = headings.shift();
        } else {
            reciprocal = getReciprocal( h0 );
        }
        
        runway.headings.push( createHeadings( runway, h0, Runways[h0], reciprocal, Runways[reciprocal] ) );

        headings = headings.filter( h => h != reciprocal );

        newRunways.push( runway );

    }

    airfield.runways = newRunways;
    delete airfield.Runways;
    
});

console.log( JSON.stringify( airfields ) );

//  Use an online beautifier to make it nice