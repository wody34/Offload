#!/usr/local/bin/coffee

fs = require('fs')
parse = require('csv-parse')
stringify = require('csv-stringify')
optimist = require('optimist')
coffeescript = require('coffee-script')

argv = null
window = {}

onCsvStringified = (err, output) ->
  if err != null
    console.log(err.stack)
    return
    
  fs.writeFileSync(argv.output, output, "utf8")

onCsvParsed = (err, array) ->
  if err != null
    console.log(err.stack)
    return

  arrayModified = window.dataPreprocessor(array)

  options = {delimiter: ';'}
  stringify(arrayModified, options, (args...) -> onCsvStringified(args...))

main = () ->
  argv = optimist
      .usage('Usage: $0 -input [csv] -output [csv] -modifier [coffee]')
      .demand(['input','output','modifier'])
      .describe('input', 'Your csv data file in accepted format')
      .describe('output', 'The name of result csv file')
      .describe('modifier', 'The file with coffeescript modification code')
      .argv

  modifierText = fs.readFileSync(argv.modifier, "utf8")
  compiledSource = coffeescript.compile(modifierText)
  eval(compiledSource)

  buf = fs.readFileSync(argv.input, "utf8")
  options = {delimiter: ';', auto_parse: true}
  parse(buf, options, (args...) -> onCsvParsed(args...) )

main()
