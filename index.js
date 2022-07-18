const width = window.innerWidth;
const height = window.innerHeight;

const root = d3.hierarchy(data);

const flatten = (_root) => {
  const _nodes = [];
  i = 0;

  function recurse(_node) {
    if (_node.children) _node.children.forEach(recurse);
    if (!_node.id) _node.id = ++i;
    _nodes.push(_node);
  }

  recurse(_root);
  return _nodes;
};

const container = d3.select("#root");

const svg = container
  .append("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, height]);

let link = svg.append("g").selectAll(".link");
let node = svg.append("g").selectAll(".node");

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance(100)
    // .strength(1)
  )
  .force("charge", d3.forceManyBody().strength(-500))
  .force("center", d3.forceCenter(0, 70))
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .force(
    "collision",
    d3.forceCollide().radius((d) => (d.depth === 0 ? 20 : 15))
  )
  .on("tick", ticked);

function ticked() {
  link
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  node
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .attr("fill", "#fff")
    .attr("font-family", "DM Sans, sans-serif");
}

function update() {
  const nodes = flatten(root);
  const links = root.links();

  // Update the links…
  link = link.data(links, (d) => d.target.id);

  // Exit any old links.
  link.exit().remove();

  // Enter any new links.
  const linkEnter = link
    .enter()
    .insert("line", ".node")
    .attr("class", (d) =>
      d.source.data.name === "Dummy" ? "link hidden" : "link"
    )
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    })
    .attr("stroke", "#fff");

  link = linkEnter.merge(link);

  // Update the nodes…
  node = node.data(nodes, function (d) {
    return d.id;
  });

  // Exit any old nodes.
  node.exit().remove();

  // Enter any new nodes.
  const nodeEnter = node
    .enter()
    .append("g")
    .attr("class", (d) => (d.data.name === "Dummy" ? "node hidden" : "node"))
    .call(drag(simulation));

  nodeEnter
    .append("circle")
    .on("click", click)
    .attr("class", (d) => (d.children ? "clickable" : ""))
    .attr("r", (d) => (d.depth === 1 ? 20 : 15))
    .attr("stroke-width", 1.5)
    .attr("fill", (d) => {
      if (d.depth === 1) {
        return "#6932e6";
      }
      return d.children ? "#14c8b9" : "#ff7d45";
    })
    .attr("stroke", "#fff");

  nodeEnter
    .append("text")
    .text((d) => d.data.name)
    .attr("transform", (d) =>
      d.depth === 1 ? "translate(25, 5)" : "translate(20, 5)"
    );

  node = nodeEnter.merge(node);

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
}

function click(event, d) {
  if (!event.defaultPrevented) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update();
  }
}

const drag = (simulation) => {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

update();
