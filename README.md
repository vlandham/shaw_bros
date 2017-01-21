# Shaw Brothers Actor Network Analysis

Part of the analysis of shaw brothers films.

Check out the [blog post]()

See this [network live](http://vallandingham.me/shaw_bros/)

Check out the [Analysis Notebook](http://vallandingham.me/shaw_bros/analyze/analyze_shaw.nb.html)


## Running

To view the demo on your computer, you need to be running a local web server.

If you have python installed, you can easily run a web-server from the command line.

First check which version of python you have installed:

```
python --version
```

If it is python 2.xx, then run the following command:

```
cd /path/to/shaw_bros

python -m SimpleHTTPServer 3000
```

If it is python 3.xx, you can use:

```
cd /path/to/shaw_bros

python3 -m http.server 3000
```

If node is more your style and you have `npm` installed, try out `http-server`:

```
# install the package globally, if you don't have it already.
# NOTE: you only need to do this once.
npm install http-server -g

cd /path/to/interactive-network-v4

http-server -p 3000
```

## Data

The data comes from [Letterboxd](https://letterboxd.com). Check out the `scrape` directory for inspiration.
