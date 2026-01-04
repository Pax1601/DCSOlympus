# ATC State Transitions

This document defines all possible state transitions for units in the ATC system.

## ATC States (from ATCState enum)

1. **UNKNOWN** - Initial state when unit enters ATC control
2. **STARTING_UP** - Unit has been cleared to start engines
3. **TAXIING_TO_RUNWAY** - Unit is taxiing from parking to runway
4. **TAXIING_TO_PARKING** - Unit is taxiing from runway to parking
5. **HOLDING_SHORT** - Unit is holding short of runway (not currently used in code)
6. **WAITING_FOR_TAKEOFF** - Unit is waiting for takeoff clearance (in queue for departure)
7. **TAKING_OFF** - Unit has been cleared for takeoff
8. **DEPARTING** - Unit is airborne after takeoff
9. **ARRIVING** - Unit is on approach (cleared for overhead break or inbound)
10. **LANDING** - Unit has been cleared to land
11. **GOING_AROUND** - Unit has been instructed to go around
12. **TOUCH_AND_GO** - Touch and go pattern (not currently used in code)

## State Transition Map

### Ground ATC States

```
UNKNOWN
  └─> STARTING_UP (via "engine start" request)
       └─> TAXIING_TO_RUNWAY (via "taxi" request OR auto-detect if moving without clearance)
            └─> WAITING_FOR_TAKEOFF (when entering hold short box & transferred to Tower)

TAXIING_TO_PARKING (when transferred from Tower)
  └─> UNKNOWN (when unit becomes airborne - control released)

UNKNOWN/STARTING_UP (auto-transition if moving >5kts without clearance)
  └─> TAXIING_TO_RUNWAY (with warning message)
```

### Tower ATC States

```
WAITING_FOR_TAKEOFF (transferred from Ground at hold short box)
  └─> TAKING_OFF (when runway clear AND first in queue)
       └─> DEPARTING (auto-transition when airborne detected)
            └─> [Transfer to Radar ATC or Unicom]

UNKNOWN (if unit directly requests departure)
  └─> TAKING_OFF (via "departure" request AND runway clear)
       └─> DEPARTING (auto-transition when airborne)
            └─> [Transfer to Radar ATC or Unicom]
  └─> WAITING_FOR_TAKEOFF (via "departure" request BUT runway occupied)

UNKNOWN (initial state when Tower takes control from ground/direct)
  └─> ARRIVING (via "initial/break/overhead" request)
       └─> LANDING (auto: <3000m from runway, <200ft AGL, runway clear)
            └─> [Transfer to Ground ATC] (when on ground & outside runway → TAXIING_TO_PARKING)
       └─> GOING_AROUND (auto: <3000m from runway, <200ft AGL, runway NOT clear)
            └─> ARRIVING (auto: when >3000m from runway OR >200ft AGL)

UNKNOWN
  └─> LANDING (via "land/final/beam" request AND runway clear)
       └─> [Transfer to Ground ATC] (when on ground & outside runway → TAXIING_TO_PARKING)

GOING_AROUND
  └─> ARRIVING (auto: when climbed above thresholds: >3000m OR >200ft AGL)
```

## Detailed State Transitions by Agency

### Ground ATC

| Current State | Trigger | Next State | Notes |
|--------------|---------|------------|-------|
| None | Unit enters Ground control area | UNKNOWN | Initial state assignment |
| UNKNOWN | "engine start" message | STARTING_UP | Cleared to start engines |
| STARTING_UP | "taxi to runway" message | TAXIING_TO_RUNWAY | Cleared to taxi to runway, position in sequence given |
| UNKNOWN | Speed >5kts detected | TAXIING_TO_RUNWAY | Auto-correction for taxiing without clearance + warning |
| STARTING_UP | Speed >5kts detected | TAXIING_TO_RUNWAY | Auto-correction for taxiing without clearance + warning |
| TAXIING_TO_RUNWAY | Inside hold short box | WAITING_FOR_TAKEOFF | Transfer to Tower (unit maintains state, Tower will update) |
| TAXIING_TO_PARKING | "taxi" message | TAXIING_TO_PARKING | Continue taxi to parking |
| Any state | Unit becomes airborne | UNKNOWN | Release control (agency set to None) |

### Tower ATC

| Current State | Trigger | Next State | Notes |
|--------------|---------|------------|-------|
| None | Unit enters Tower control area | UNKNOWN | Initial state assignment |
| WAITING_FOR_TAKEOFF | Runway clear AND first in queue | TAKING_OFF | Auto-cleared for takeoff |
| UNKNOWN | "departure" request + runway clear | TAKING_OFF | Immediate clearance for takeoff |
| UNKNOWN | "departure" request + runway occupied | WAITING_FOR_TAKEOFF | Hold short with position number |
| TAKING_OFF | Unit airborne detected | DEPARTING | Automatic transition |
| DEPARTING | Auto-check when airborne | [Transfer to Radar/Unicom] | Handoff to departure control or release |
| UNKNOWN | "initial/break/overhead" request | ARRIVING | Cleared for overhead break |
| ARRIVING | Position: <3000m, <200ft AGL + runway clear | LANDING | Auto-cleared to land |
| ARRIVING | Position: <3000m, <200ft AGL + runway occupied | GOING_AROUND | Go around instruction |
| GOING_AROUND | Position: >3000m OR >200ft AGL | ARRIVING | Auto-transition back to arriving |
| UNKNOWN | "land/final/beam" request + runway clear | LANDING | Cleared to land (straight-in) |
| UNKNOWN | "land/final/beam" request + runway occupied | UNKNOWN | Continue (no clearance given) |
| LANDING | On ground + outside runway | TAXIING_TO_PARKING | Transfer to Ground ATC initiated |

## Agency Transfer Points

### Ground → Tower
- **Trigger**: Unit in TAXIING_TO_RUNWAY state enters hold short box
- **Action**: Unit instructed to contact Tower frequency
- **New State**: Unit maintains current state, Tower typically assigns WAITING_FOR_TAKEOFF
- **Note**: Unit's state is preserved during transfer

### Tower → Radar/Unicom (Departure)
- **Trigger**: Unit in DEPARTING state detected airborne
- **Action**: Unit instructed to contact Departure frequency (if Radar available) or monitor Unicom
- **New State**: Controlled by Radar ATC or released to Unicom
- **Note**: Unit exits Tower's control area

### Tower → Ground (Arrival)
- **Trigger**: Unit in LANDING state, on ground, outside runway box
- **Action**: Unit instructed to contact Ground frequency
- **New State**: TAXIING_TO_PARKING (set by Ground's transfer_unit method)
- **Note**: Completes the arrival sequence

## Special Cases and Edge Conditions

1. **Unauthorized Taxi**: 
   - If a unit in UNKNOWN or STARTING_UP state is detected moving >5kts
   - Ground ATC auto-assigns TAXIING_TO_RUNWAY state
   - Sends warning: "if you are on this frequency hold position and request taxi clearance"
   - Prevents repeated warnings by changing state

2. **Runway Queue Management**: 
   - Tower maintains an ordered list of units in WAITING_FOR_TAKEOFF or TAKING_OFF states
   - Units are sorted by their `order` attribute
   - Only the first unit in queue can be auto-cleared for takeoff
   - Units requesting departure when runway is occupied are given position: "number X for departure"

3. **Go Around Recovery**:
   - Unit in GOING_AROUND state is monitored for position
   - Automatically returns to ARRIVING when:
     - Distance to runway > 3000m OR
     - Altitude above runway > 200ft
   - Allows for re-sequencing in the pattern

4. **Auto-Clearance for Takeoff**:
   - Units in WAITING_FOR_TAKEOFF state are automatically cleared when:
     - Runway is clear
     - Unit is first in takeoff order queue
     - Unit is on the ground
   - Provides proactive clearance without pilot request

5. **Multiple Taxi Sequences**:
   - Ground ATC provides traffic advisories
   - Counts units taxiing to runway (provides sequence)
   - Counts units taxiing to parking (traffic advisory)
   - References traffic by aircraft name ("behind the [aircraft name]")

6. **No Radar Available**: 
   - If Tower has no Radar ATC configured
   - Departing units are released to Unicom (122.8 MHz)
   - Message: "proceed on course and monitor [Unicom frequency]"

7. **No Ground Available**: 
   - If Tower has no Ground ATC configured
   - Landing units are released to Unicom
   - Message: "taxi at own discretion and monitor [Unicom frequency]"

8. **Airborne Without Clearance**:
   - If a Ground-controlled unit becomes airborne
   - Control is immediately released (agency set to None)
   - State reset to UNKNOWN

## Control Area Boundaries

### Ground ATC
- **Horizontal**: Within 5000m of runway center
- **Vertical**: On ground only (not airborne)
- **Action**: Takes control of units meeting criteria, unless already controlled by another agency

### Tower ATC
- **Horizontal**: Within 5 nautical miles (9260m) of runway center
- **Vertical**: 
  - Airborne: Altitude ≤ 5000ft (1524m) AGL
  - On ground: On runway only (inside runway box polygon)
- **Action**: Takes control of units meeting criteria, unless already controlled by another agency

## Distance/Altitude Thresholds

| Threshold | Value | Purpose |
|-----------|-------|---------|
| Ground Control Radius | 5000m | Horizontal range for ground control |
| Tower Control Radius | 5 NM (9260m) | Horizontal range for tower control |
| Tower Control Altitude | 5000ft (1524m) AGL | Maximum altitude for tower control |
| Landing Distance Threshold | 3000m | Distance from runway for auto-clearance/go-around |
| Landing Altitude Threshold | 200ft (61m) AGL | Altitude above runway for auto-clearance/go-around |
| Unauthorized Taxi Speed | 5 kts | Speed threshold for detecting taxi without clearance |

## State Validation Rules

- Units can only be in ONE state at a time
- State transitions are logged at INFO level for debugging
- Invalid state transitions are caught and logged as errors
- Units lose ATC control when:
  - They exit the control area (altitude/distance)
  - They are destroyed (alive = false)
  - They are transferred to another agency
  - They become airborne while under Ground control
- States are stored as ATCState enum values, not strings
- Each agency checks if a unit is already controlled before taking control
- Agencies skip units controlled by other agencies during update cycles
