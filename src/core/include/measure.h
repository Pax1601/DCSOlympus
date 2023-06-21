#pragma once
#include "framework.h"

class Measure
{
public:
	Measure(json::value value, long long time): value(value), time(time) {};
	
	void setValue(json::value newValue) { value = newValue; }
	void setTime(long long newTime) { time = newTime; }
	json::value getValue() { return value; }
	long long getTime() { return time; }

private:
	json::value value;
	long long time;

};

