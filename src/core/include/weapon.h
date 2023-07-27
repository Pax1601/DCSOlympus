#pragma once
#include "framework.h"
#include "utils.h"
#include "dcstools.h"
#include "luatools.h"
#include "measure.h"
#include "logger.h"
#include "commands.h"
#include "datatypes.h"

#include <chrono>
using namespace std::chrono;

class Weapon
{
public:
	Weapon(json::value json, unsigned int ID);
	~Weapon();

	/********** Methods **********/
	void initialize(json::value json);
	void update(json::value json, double dt);
	unsigned int getID() { return ID; }
	void getData(stringstream& ss, unsigned long long time);
	void triggerUpdate(unsigned char datumIndex);
	bool hasFreshData(unsigned long long time);
	bool checkFreshness(unsigned char datumIndex, unsigned long long time);

	/********** Setters **********/
	virtual void setCategory(string newValue) { updateValue(category, newValue, DataIndex::category); }
	virtual void setAlive(bool newValue) { updateValue(alive, newValue, DataIndex::alive); }
	virtual void setCoalition(unsigned char newValue) { updateValue(coalition, newValue, DataIndex::coalition); }
	virtual void setName(string newValue) { updateValue(name, newValue, DataIndex::name); }
	virtual void setPosition(Coords newValue) { updateValue(position, newValue, DataIndex::position); }
	virtual void setSpeed(double newValue) { updateValue(speed, newValue, DataIndex::speed); }
	virtual void setHeading(double newValue) { updateValue(heading, newValue, DataIndex::heading); }

	/********** Getters **********/
	virtual string getCategory() { return category; };
	virtual bool getAlive() { return alive; }
	virtual unsigned char getCoalition() { return coalition; }
	virtual string getName() { return name; }
	virtual Coords getPosition() { return position; }
	virtual double getSpeed() { return speed; }
	virtual double getHeading() { return heading; }
	
protected:
	unsigned int ID;

	string category;
	bool alive = false;
	unsigned char coalition = NULL;
	string name = "";
	Coords position = Coords(NULL);
	double speed = NULL;
	double heading = NULL;
	
	/********** Other **********/
	map<unsigned char, unsigned long long> updateTimeMap;

	/********** Private methods **********/
	void appendString(stringstream& ss, const unsigned char& datumIndex, const string& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));
		ss << datumValue;
	}

	/********** Template methods **********/
	template <typename T>
	void updateValue(T& value, T& newValue, unsigned char datumIndex)
	{
		if (newValue != value)
		{
			triggerUpdate(datumIndex);
			value = newValue;
		}
	}

	template <typename T>
	void appendNumeric(stringstream& ss, const unsigned char& datumIndex, T& datumValue) {
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&datumValue, sizeof(T));
	}

	template <typename T>
	void appendVector(stringstream& ss, const unsigned char& datumIndex, vector<T>& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));

		for (auto& el : datumValue)
			ss.write((const char*)&el, sizeof(T));
	}

	template <typename T>
	void appendList(stringstream& ss, const unsigned char& datumIndex, list<T>& datumValue) {
		const unsigned short size = datumValue.size();
		ss.write((const char*)&datumIndex, sizeof(unsigned char));
		ss.write((const char*)&size, sizeof(unsigned short));

		for (auto& el : datumValue)
			ss.write((const char*)&el, sizeof(T));
	}
};

class Missile : public Weapon
{
public:
	Missile(json::value json, unsigned int ID);
};

class Bomb : public Weapon
{
public:
	Bomb(json::value json, unsigned int ID);
};