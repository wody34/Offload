Modifier is a script that lets you reuse your modifiers from dashboard and apply them the the whole csv data file. 
Suppose you want to smooth charts. You first write coffeescript code that smooths your data in dashboard and then apply the same code to smooth the whole data in the same way.

### How to use:

    Usage: coffee ./modifier.coffee -input [csv] -output [csv] -modifier [coffee]

    Options:
      --input     Your csv data file in accepted format         [required]
      --output    The name of result csv file                   [required]
      --modifier  The file with coffeescript modification code  [required]

### A modification code sample:

``` coffeescript
window.dataPreprocessor = (data) =>
    for el in data

        switch el[0]
            when 1 #accelerometer
                el[3] = el[3] * 1.5 #x
                el[4] = el[4] * 1.5 #y
                el[5] = el[5] * 1.5 #z
            when 4 #gyroscope
                el[3] = el[3] * 1.2 #x
                el[4] = el[4] * 1.2 #y
                el[5] = el[5] * 1.2 #z
            when 'geo' #geodata
                el[9] = el[9] / 2 #speed
                    
    return data
```