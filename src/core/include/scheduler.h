#pragma once
#include "framework.h"
#include "luatools.h"
#include "commands.h"

class Scheduler
{
public:
	Scheduler(lua_State* L);
	~Scheduler();

	void appendCommand(Command* command);
	void execute(lua_State* L);
	void handleRequest(string key, json::value value, string username, json::value& answer);
	bool checkSpawnPoints(int spawnPoints, string coalition);
	bool isCommandExecuted(string commandHash) { return (find(executedCommandsHashes.begin(), executedCommandsHashes.end(), commandHash) != executedCommandsHashes.end()); }
	
	void setFrameRate(double newFrameRate) { frameRate = newFrameRate; }
	void setRestrictSpawns(bool newRestrictSpawns) { restrictSpawns = newRestrictSpawns; }
	void setRestrictToCoalition(bool newRestrictToCoalition) { restrictToCoalition = newRestrictToCoalition; }
	void setSetupTime(unsigned int newSetupTime) { setupTime = newSetupTime; }
	void setBlueSpawnPoints(unsigned int newBlueSpawnPoints) { blueSpawnPoints = newBlueSpawnPoints; }
	void setRedSpawnPoints(unsigned int newRedSpawnPoints) { redSpawnPoints = newRedSpawnPoints; }
	void setEras(vector<string> newEras) { eras = newEras; }
	void setCommandModeOptions(json::value newOptions);

	int getFrameRate() { return frameRate; };
	int getLoad();
	bool getRestrictSpawns() { return restrictSpawns; }
	bool getRestrictToCoalition() { return restrictToCoalition; }
	unsigned int getSetupTime() { return setupTime; }
	unsigned int getBlueSpawnPoints() { return blueSpawnPoints; }
	unsigned int getRedSpawnPoints() { return redSpawnPoints; }
	vector<string> getEras() { return eras; }
	json::value getCommandModeOptions();

private:
	list<Command*> commands;
	list<string> executedCommandsHashes;
	unsigned int load;
	double frameRate;
	
	bool restrictSpawns = false;
	bool restrictToCoalition = false;
	unsigned int setupTime = 300;
	unsigned int blueSpawnPoints = 10000;
	unsigned int redSpawnPoints = 10000;
	vector<string> eras = { "WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern" };
};

