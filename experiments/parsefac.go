// Program to partially parse the faculty list associated with the
// facultyapp application. The faculty list is a text file containing
// names and other info about faculty members, like this:
// Teitelbaum,=Tim       A1 F 1973     S 1979
//
//	         SL F 1979     S 1981
//
//	         A2 F 1981     S 1989
//	SAB      A2 F 1989     S 1990
//	              A2 F 1990     S 1997
//	SAB      A2 F 1997     present .
//
// The main function of the program is to compute the number of years each
// faculty member worked, not including semesters on non-sabbatical leave
// (marked LEA). This will be used to check the results of facultyapp.
//
// Mark Riordan  23-FEB-2024

package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"strconv"
	"strings"
)

type States int

const (
	ST_BEGIN States = iota
	ST_LOOKING_TITLE
	ST_LOOKING_START_SEM
	ST_LOOKING_START_YEAR
	ST_LOOKING_END_SEM
	ST_LOOKING_END_YEAR
)

type TokensData struct {
	tokens []string
	index  int
}

func MyTokenizer(input string) *TokensData {
	return &TokensData{
		tokens: strings.Fields(input),
		index:  0,
	}
}

func (t *TokensData) NextToken() (string, bool) {
	if t.index >= len(t.tokens) {
		return "", false
	}
	token := t.tokens[t.index]
	t.index++
	return token, true
}

func AddSpan(name string, ignore bool, yearsForFac *float64, startSem string, startYear string,
	endSem string, endYear string) {
	// Process this range of semesters
	// The start and end semesters are inclusive, so someone starting
	// in the fall of 1980 and ending in the fall of 1980 has worked
	// 0.5 years, not 0.0 years.
	numStartYear, _ := strconv.Atoi(startYear)
	numEndYear, _ := strconv.Atoi(endYear)
	var numYears float64
	numYears = float64(numEndYear - numStartYear)
	if startSem == "S" && endSem == "F" {
		// A year starts in the spring and ends in the fall;
		// e.g. Spring 1980 to Fall 1980 is 1.0 years
		numYears += 1.0
	} else if startSem == "F" && endSem == "S" {
		// A year starts in the fall and ends in the spring;
		// e.g. Fall 1980 to Spring 1981 is one year
	} else {
		// The start and end semesters are the same;
		// e.g. Fall 1980 to Fall 1980 is 0.5 years
		numYears += 0.5
	}
	if !ignore {
		*yearsForFac += numYears
		//fmt.Println(name+" startSem="+startSem, " startYear="+startYear, " endSem="+endSem, " endYear="+endYear)
	} else {
		fmt.Println(" ignoring ", numYears, "for", startSem, startYear, endSem, endYear)
	}
}

func ParseFac(input string) {
	t := MyTokenizer(input)
	var name, title, startSem, startYear, endSem, endYear string
	ignore := false
	yearsForFac := 0.0
	state := ST_BEGIN
	for {
		token, ok := t.NextToken()
		if !ok {
			break
		}
		if token == "." {
			state = ST_BEGIN
			fmt.Println(name + "\t" + strconv.FormatFloat(yearsForFac, 'f', 1, 64))
			yearsForFac = 0.0
			ignore = false
		} else {
			switch state {
			case ST_BEGIN:
				name = token
				//fmt.Println("Name: ", name)
				state = ST_LOOKING_TITLE
			case ST_LOOKING_TITLE:
				if token == "LEA" {
					ignore = true
				} else if token == "SAB" {
				} else {
					title = token
					state = ST_LOOKING_START_SEM
				}
			case ST_LOOKING_START_SEM:
				startSem = token
				state = ST_LOOKING_START_YEAR
			case ST_LOOKING_START_YEAR:
				startYear = token
				state = ST_LOOKING_END_SEM
			case ST_LOOKING_END_SEM:
				endSem = token
				if endSem == "present" {
					endSem = "S"
					endYear = "1999"
					AddSpan(name, ignore, &yearsForFac, startSem, startYear, endSem, endYear)
					state = ST_LOOKING_TITLE
				} else {
					state = ST_LOOKING_END_YEAR
				}
			case ST_LOOKING_END_YEAR:
				endYear = token
				AddSpan(name, ignore, &yearsForFac, startSem, startYear, endSem, endYear)
				ignore = false
				state = ST_LOOKING_TITLE
			}
		}
	}
	_ = title
}

func main() {
	content, err := ioutil.ReadFile("faclist.txt")
	if err != nil {
		log.Fatal(err)
	}

	ParseFac(string(content))
}
