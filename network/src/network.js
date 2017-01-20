
var movieDetails = {};
var strokeColor = '#ddd';
var highlightColor = 'tomato';
/*
 * network
 */
function network() {
  // Constants for sizing
  var width = 960;
  var height = 800;

  // variables to refect the current settings
  // of the visualization
  var layout = 'force';
  var sort = 'songs';

  // 'global' variables for the network
  // these will be populated in the setup
  // of the network
  var svg = null;
  var nodes = null;
  var edges = null;
  var allData = {};
  var linkedByIndex = {};
  var showEdges = true;
  var chargePower = 0.04;

  var minEdgeCount = 8;


  // colors for nodes
  var colorScheme = d3.scaleOrdinal(d3.schemeCategory20);

  // tooltip for mouseover functionality
  // implemented in tooltip.js
  // var tooltip = floatingTooltip('network-tooltip', 200);

  /*
  * Charge function used to set the strength of
  * the many-body force.
  * Charge is negative because we want nodes to repel
  * @v4 Before this was used to set the charge
  *  attribute of the force layout itself.
  *  Now, it is used with a separate force.
  */
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * chargePower;
  }

  /*
  * Callback executed after ever tick of the simulation
  * @v4 The old tick function was more complicated as we
  *  had to add in our custom force adjustments.
  *  Now, all this is handled in the separate forces added
  *  to the simulation, so here we just need to move
  *  nodes and edges to their new locations.
  */
  function ticked() {
    nodes
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });

    if (showEdges) {
      edges
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });
    } else {
      edges
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 0);
    }
  }

  function ended() {
    showEdges = true;
    ticked();
  }

  // Here we create a force layout
  // @v4 It is now just the 'simulation'
  //  and will have forces added to it later
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .alphaMin(0.1)
    .on('tick', ticked)
    .on('end', ended);


  // @v4 Simulation starts automatically,
  //  We don't want it to start until it has
  //  nodes so stop for now.
  simulation.stop();

  /*
  * Entry point to create network.
  * This function is returned by the
  * enclosing function and will be what is
  * executed when we have data to visualize.
  */
  var chart = function (selector, rawData) {
    allData = setupData(rawData);

    // create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // add some groups for edges and nodes
    var g = svg.append('g')
      .attr('class', 'all');

    g.append('g')
      .attr('class', 'edges');

    g.append('g')
      .attr('class', 'nodes');

    g.append('g')
      .attr('class', 'titles');


    svg.call(d3.zoom()
      .scaleExtent([1 / 2, 8])
      .on('zoom', zoomed));

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    // render the network
    render();
  };

  /*
  * This function is executed any time the
  * network is modified. It filters the nodes
  * and edges based on the configuration of the
  * controls, sets up the force simulation, and
  * then restarts it to animate.
  */
  function render() {
    // filter data to show based on current filter settings.
    var filteredEdges = filterEdges(allData.links);
    var filteredNodes = filterNodes(allData.nodes, filteredEdges);

    // @v4 set the nodes of the simulation
    simulation.nodes(filteredNodes);

    // adjust the simulation based on
    // if the layout is force directed or radial
    if (layout === 'force') {
      setupNetworkLayout(filteredEdges);
    } else {
      setupRadialLayout();
    }

    renderNodes(filteredNodes);
    renderEdges(filteredEdges);

    // @v4 Now we need to set the alpha
    //  of the simulation when we restart.
    simulation.alpha(1).restart();
  }

  /*
  * Sets up simulation with forces needed
  * for regular force-directed layout.
  * @v4 This is a major change from v3.
  *  Now we add separate forces to the simulation,
  *  providing a name and a force function.
  *  Reusing a force name will override any
  *  existing force attached to it.
  */
  function setupNetworkLayout(edgesData) {
    // now edges and how they impact
    // the layout of the network is all
    // handled in a link force
    var linkForce = d3.forceLink()
      .distance(100)
      .strength(1)
      .links(edgesData);

    // add the link force to the simulation
    simulation.force('links', linkForce);
    // setup a center force to keep nodes
    // in middle of the div
    simulation.force('center', d3.forceCenter(width / 2, (height / 2) - 160));

    // setup many body force to have nodes repel one another
    // increasing the chargePower here to make nodes stand about
    chargePower = 1.0;
    simulation.force('charge', d3.forceManyBody().strength(charge));
    // simulation.force('gravity', d3.forceManyBody().strength(-150).distanceMax(100));
    // kill x and y forces used in radial layout
    simulation.force('x', null);
    simulation.force('y', null);
  }

  /*
  * Sets up simulation with forces needed
  * for radial layout.
  * @v4 This is a major change from v3.
  *  Now we add separate forces to the simulation,
  *  providing a name and a force function.
  *  Reusing a force name will override any
  *  existing force attached to it.
  */
  function setupRadialLayout() {

    // we don't want the center force
    // or links force affecting the network
    // in radial mode - so kill them.
    simulation.force('center', null);
    simulation.force('links', null);

    // use many-body force to reduce node overlap
    // in node clusters.
    chargePower = 0.04;
    simulation.force('charge', d3.forceManyBody().strength(charge));

    // radialLayout is implemented in radial_layout.js
    // groupCenters will have an {x: y:} object for
    // each artist in artists.
    var groupCenters = radialLayout()
      .center({ x: width / 2, y: (height / 2) })
      .radius(200)
      .increment(2)
      .keys(artists);

    // use groupCenters to adjust x position of
    // nodes with an x force
    var xForce = d3.forceX()
      .strength(0.02)
      .x(function (d) { return groupCenters(d.id).x; });

    // use groupCenters to adjust y position of
    // nodes with an y force
    var yForce = d3.forceY()
      .strength(0.02)
      .y(function (d) { return groupCenters(d.id).y; });

    // add these forces to the simulation
    simulation.force('x', xForce);
    simulation.force('y', yForce);
  }

  /*
  * Filter down nodes based on controls configuration
  */
  function filterNodes(nodesData, edgesData) {
    var sourceMap = d3.map(edgesData, function (d) { return d.source.id; });
    var targetMap = d3.map(edgesData, function (d) { return d.target.id; });

    var newNodesData = nodesData.filter(function (d) {
      return (sourceMap.has(d.id) || targetMap.has(d.id));
    });

    // var newNodesData = nodesData;
    // if (filter === 'popular' || filter === 'obscure') {
    //   var playcounts = nodesData.map(function (d) { return d.playcount; });
    //   playcounts = playcounts.sort(d3.ascending);
    //   var cutoff = d3.quantile(playcounts, 0.5);
    //   newNodesData = nodesData.filter(function (d) {
    //     if (filter === 'popular') {
    //       return d.playcount > cutoff;
    //     }
    //     return d.playcount <= cutoff;
    //   });
    // }

    return newNodesData;
  }

  /*
  * Filter down edges based on what nodes are
  * currently present in the network.
  */
  function filterEdges(edgesData, nodesData) {
    var nodesMap = d3.map(nodesData, function (d) { return d.id; });

    // var newEdgesData = edgesData.filter(function (d) {
    //   return nodesMap.get(d.source.id) && nodesMap.get(d.target.id);
    // });

    var newEdgesData = edgesData.filter(function (d) {
      return d.count >= minEdgeCount;
    });

    return newEdgesData;
  }

  /*
  * This performs the enter / exit / merge
  * d3 functionality for node data.
  */
  function renderNodes(nodesData) {
    nodes = svg.select('.nodes').selectAll('.node')
      .data(nodesData);

    var nodesE = nodes.enter().append('circle')
      .classed('node', true)
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .on('mouseover', highlightNode)
      .on('mouseout', unhighlightNode);

    nodes.exit().remove();

    nodes = nodes.merge(nodesE)
      .attr('r', function (d) { return d.radius; })
      .style('fill', function (d) { return colorScheme(d.artist); })
      .style('stroke', 'white')
      // .style('stroke', function (d) { return strokeFor(d); })
      .style('stroke-width', 1.0);
  }

  /*
  * This performs the enter / exit / merge
  * d3 functionality for edge data.
  */
  function renderEdges(edgesData) {
    edges = svg.select('.edges').selectAll('.edge')
      .data(edgesData, function (d) { return d.id; });


    var edgesE = edges.enter().append('line')
      .classed('edge', true);

    edges.exit().remove();

    edges = edges.merge(edgesE)
      .style('stroke-opacity', function (e) { return e.opacity; })
      .style('stroke-width', function (e) { return e.width; })
      .style('stroke', strokeColor);


    // edges = edges.merge(edgesE);
  }

  /*
  * Called when data is updated,
  * sets up scales to be appropriate for the
  * currently selected data.
  * Transforms node Id's to node objects for
  * edge data.
  */
  function setupData(data) {

    var countExtent = d3.extent(data.links, function (d) { return d.count; });

    console.log(countExtent)

    var edgeScale = d3.scaleLinear()
      .domain(countExtent)
      .range([1, 14]);

    var opacityScale = d3.scaleLinear()
      .domain(countExtent)
      .range([0.2, 1.0]);

    // var radiusScale = d3.scalePow()
    //   .exponent(0.5)
    //   .range([3, 12])
    //   .domain(countExtent);

    data.nodes.forEach(function (n) {
      // add radius to the node so we can use it later
      // n.radius = radiusScale(n.playcount);
      n.radius = 6;
    });

    data.links.forEach(function (e) {
      e.width = edgeScale(e.count);
      e.opacity = opacityScale(e.count);
      linkedByIndex[e.id] = e.count;
    });

    // var nodesMap = d3.map(data.nodes, function (d) { return d.id; });

    // switch links to point to node objects instead of id's
    // data.links.forEach(function (l) {
    //   l.source = nodesMap.get(l.source);
    //   l.target = nodesMap.get(l.target);
    //   l.id = l.source.id + ':' + l.target.id;
    //
    //   // linkedByIndex is used for link sorting
    // });

    return data;
  }

  /*
  * Public function to update the layout.
  * Most of the work happens in render()
  */
  chart.updateLayout = function (newLayout) {
    layout = newLayout;
    showEdges = layout === 'force';
    render();
    return this;
  };

  /*
  * Public function to update node filters.
  * Most of the work happens in render()
  */
  chart.updateFilter = function (newFilter) {
    minEdgeCount = newFilter;
    render();
    return this;
  };

  /*
  * Public function to update input data
  * Most of the work happens in render()
  */
  chart.updateData = function (newData) {
    allData = setupData(newData);
    render();
  };

  /*
  * Public function to handle search.
  * Updates nodes if a match is found.
  */
  chart.updateSearch = function (searchTerm) {
    var searchRegEx = new RegExp(searchTerm.toLowerCase());
    nodes.each(function (d) {
      var element = d3.select(this);
      var match = d.name.toLowerCase().search(searchRegEx);
      if (searchTerm.length > 0 && match >= 0) {
        element.style('fill', '#F38630')
          .style('stroke-width', 2.0)
          .style('stroke', '#555');
        d.searched = true;
      } else {
        d.searched = false;
        element.style('fill', function (e) { return colorScheme(e.artist); })
          .style('stroke-width', 1.0);
      }
    });
  };

  function getNotThem(d, edgeData) {
    if (d.id == edgeData.source.id) {
      return edgeData.target;
    } else {
      return edgeData.source;
    }
  }
  function showDetails(d) {
    var out = '';
    var details = d3.select('#info');
    var infoTitle = d3.select('#infoTitle')
    infoTitle.html(d.name);

    var connections = [];

    edges.filter(function (l) { return (l.source.id === d.id || l.target.id === d.id); }).each(function (e) { connections.push(e); })

    out += '<p class="movieCount">has ' + connections.length + ' connections</p>';

    connections.forEach(function (c) {
      var collab = '<div class="aConnection">';
      collab += '<p class="connTitle">' + getNotThem(d, c).name + ' ' +
        '<span class="connCount">(' + c.movies.length + ' movies)</span>' + '</p>';

      var movieList = '<ul>';
      c.movies.forEach(function (m) {
        movieList += '<li>' + movieDetails[m].title + '</li>';
      });
      movieList += '</ul>';
      collab += movieList;
      collab += '</div>';
      out += collab;
    });

    console.log(connections)

    details.html(out);
  }

  /*
  * Callback for mouseover event.
  * Highlights a node and connected edges.
  */
  function highlightNode(d) {
    var content = '<p class="main">' + d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main">' + d.artist + '</span></p>';
    // tooltip.showTooltip(content, d3.event);

    var titles = svg.select('.titles').selectAll('.title')
      .data([d])
    var titlesE = titles.enter()
      .append('g')
      .attr('class', 'title')

    titlesE.append('text').attr('x', function (e) { return e.x; })
      .attr('y', function (e) { return e.y; })
      .attr('dx', 10)
      .attr('dy', 4)
      .attr('pointer-events', 'None')
      .text(function (e) { return e.name; })


    showDetails(d);

    if (showEdges) {
      edges
        .style('stroke', function (l) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return 'tomato';
          }
          return strokeColor;
        })
        .style('stroke-opacity', function (l) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return 1.0;
          }
          return 0.00;
        });
      // higlight connected nodes
      nodes
        .style('stroke', function (n) {
          if (d.id === n.id || n.searched || neighboring(d, n)) {
            return '#555';
          }
          return 'white';
        })
        .style('stroke-width', function (n) {
          if (d.id === n.id || n.searched || neighboring(d, n)) {
            return 2.0;
          }
          return 1.0;
        });
    }
  }

  /*
  * Helper function returns not-false
  * if a and b are connected by an edge.
  * Uses linkedByIndex object.
  */
  function neighboring(a, b) {
    return linkedByIndex[a.id + ':' + b.id] >= minEdgeCount ||
      linkedByIndex[b.id + ':' + a.id] >= minEdgeCount;
  }

  /*
  * Callback for mouseout event.
  * Unhighlights node.
  */
  function unhighlightNode() {
    // tooltip.hideTooltip();

    svg.select('.titles').selectAll('.title').remove();

    // reset edges
    edges
      .style('stroke', strokeColor)
      .style('stroke-opacity', function (e) { return e.opactiy; });

    // reset nodes
    nodes
      .style('stroke', 'white')
      .style('stroke-width', 1.0);
  }

  return chart;
} // end of the network() code!


/*
 * Below is the initialization code as well as some helper functions
 * to create a new network instance, load the data, and display it.
 */

// create new network
var myNetwork = network();

function createId(text) {
  var idText = text.replace(/\s+/g, '_').toLowerCase();
  return idText;
}

function createEdgeId(actorArray) {
  actorArray.sort(function (a, b) {
    if (a.id < b.id) {
      return -1;
    }
    if (a.id > b.id) {
      return 1;
    }
    return 0;
  });

  return actorArray.map(function (a) { return a.id; }).join(':');
}

function setupNodesEdges(rawData) {
  var nodesHash = {};
  var edgesHash = {};

  var data = { nodes: [], links: [] };
  rawData.forEach(function (movie) {
    movie.id = createId(movie.title);

    movieDetails[movie.id] = movie;

    var castLen = movie.cast.length;
    for (var i = 0; i < castLen; i++) {
      var actor1 = movie.cast[i];
      actor1.id = createId(actor1.name);
      if (!nodesHash[actor1.id]) {
        nodesHash[actor1.id] = actor1;
      } else {
        actor1 = nodesHash[actor1.id];
      }
      for (var j = 0; j < castLen; j++) {
        var actor2 = movie.cast[j];
        actor2.id = createId(actor2.name);
        if (!nodesHash[actor2.id]) {
          nodesHash[actor2.id] = actor2;
        } else {
          actor2 = nodesHash[actor2.id];
        }
        if (i !== j) {
          var edgeId = createEdgeId([actor1, actor2]);
          if (!edgesHash[edgeId]) {
            edgesHash[edgeId] = { id: edgeId,
              source: actor1, target: actor2,
              count: 0, movies: [] };
          }

          if (!edgesHash[edgeId].movies.includes(movie.id)) {
            edgesHash[edgeId].count += 1;
            edgesHash[edgeId].movies.push(movie.id);
          }
        }
      }
    }
  });

  data.nodes = Object.values(nodesHash);
  data.links = Object.values(edgesHash);

  console.log(data);
  return data;
}


/*
 * Function called once data is loaded from CSV.
 * Calls myNetwork function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  var nData = setupNodesEdges(data);

  myNetwork('#vis', nData);
}


// Load the data.
// by default it loads the immortal classic,
// "You can call me Al" by Paul Simon.
d3.json('data/shaw.json', display);

// Activate selector button
function activate(group, link) {
  d3.selectAll('#' + group + ' a')
    .classed('active', false);
  d3.select('#' + group + ' #' + link)
    .classed('active', true);
}


/*
 * Connects menu buttons to callback functions
 * that update the network layout.
 */
function setupMenu() {
  // layout buttons
  d3.selectAll('#layouts a').on('click', function () {
    var newLayout = d3.select(this).attr('id');
    activate('layouts', newLayout);
    myNetwork.updateLayout(newLayout);
  });

  // filter buttons
  d3.selectAll('#filters #minCount').on('input', function () {
    var newFilter = +this.value;
    myNetwork.updateFilter(newFilter);
    d3.select('#minCountNum').text(newFilter);
  });

  // sort buttons
  d3.selectAll('#sorts a').on('click', function () {
    var newSort = d3.select(this).attr('id');
    activate('sorts', newSort);
    myNetwork.updateSort(newSort);
  });

  // select song drop down
  d3.select('#song_select').on('change', function () {
    var songFile = d3.select(this).property('value');
    d3.json('data/' + songFile, function (json) {
      myNetwork.updateData(json);
    });
  });

  // search
  d3.select('#search').on('keyup', function () {
    var searchTerm = d3.select(this).property('value');
    myNetwork.updateSearch(searchTerm);
  });
}

// call our setup function
setupMenu();
