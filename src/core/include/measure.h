#pragma once
#include "framework.h"

class Measure
{
public:
	Measure(json::value value, int time): value(value), time(time) {};
	
	void setValue(json::value newValue) { value = newValue; }
	void setTime(int newTime) { time = newTime; }
	json::value getValue() { return value; }
	int getTime() { return time; }

private:
	json::value value;
	int time;

};

