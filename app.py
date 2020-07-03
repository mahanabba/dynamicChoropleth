from flask import Flask, render_template, request, jsonify, make_response
import os
import pandas as pd
import json
import requests

app = Flask(__name__)


filepath = os.path.join("Resources", "data.csv")
usfile = os.path.join("Resources", "us.json")
data = pd.read_csv(filepath, encoding="latin-1")
data = data.to_json(orient='records')
topojson = json.load(open(usfile))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/map')
def getData():
    return topojson

@app.route('/data')
def getCountyData():
    return data

if __name__ == '__main__':
    app.run(debug = True)