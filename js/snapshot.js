
var fill = d3.scale.ordinal()
    .domain(d3.range(3))
    .range(["#FFDD89"]);
    
var chartWidth = parseInt(d3.select("#chart").style("width").replace("px",""),10);
var margin = {top: 1, right: 1, bottom: 6, left: 1},
    width = chartWidth - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var formatNumber = d3.format(",.0f"),
    format = function(d) { return formatNumber(d) + " "; },
    color = d3.scale.category20();

var svg = d3.select("#chart").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
	.attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom) )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("pointer-events", "all")
    .call(d3.behavior.zoom().on("zoom", redraw))
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");;
	
	
var sankey = d3.sankey()
    .nodeWidth(10)
    .nodePadding(6)
    .size([width, height]);

var resume = null;
var redraw = function (){};
GetMapOnInit();

d3.selectAll(".allgclass").on("click",function(){ 
redraw = GetMapOnInit; GetMapOnInit();}
);

d3.selectAll(".empgclass").on("click",function(){
	var companyName = d3.select(this).attr("emp");
	redraw = function(){
				GetMapByCompany(companyName);
				};
	GetMapByCompany(companyName);
	});

d3.selectAll(".toolgclass").on("click",function(){ 
redraw = GetMapToolkit;
GetMapToolkit();

});

function AddPath(link)
{ 
    link.enter()
		.append("path");
}

function DrawPath(link){
var path = sankey.link();
 paths = link
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(0, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });
 

  link.append("title")
      .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

}

function DragNode(node,link){
 node
	.call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function() { this.parentNode.appendChild(this); })
      .on("drag", function(d){
 				d3.select(this).attr("transform", 
        "translate(" + (
            d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
        )
        + "," + (
            d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
        ) + ")");
    sankey.relayout();
    link.attr("d", sankey.link());
 }));
}

function AddNode(node)
{
  node  
    .enter().append("g");
}

function DrawNode(node)
{
	node
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  	node
  	.append("rect")
	      .attr("height", function(d) { return Math.max(0, d.dy);})
	      .attr("width", sankey.nodeWidth())
	      .style("fill", function(d) { 
	      		 return d.color = fill(d.name.replace(/ .*/, ""));
	      		})
	      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); }) ;
    
      node.append("title")
      .text(function(d) { return d.name + "\n" + format(d.value); });

  node
    .append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");
}

function PruneMap(n,l)
{
  var newMap = {"nodes" : [], "links" : null};
  var newNodeArray = []
  
  l.forEach(function(element, index, array){
    var insertedAt = -1;
  	if(newNodeArray.indexOf(n[element.source].name) === -1)
  	{
  	 insertedAt = newNodeArray.length;
  		newNodeArray[insertedAt] = n[element.source].name;
  		element.source = insertedAt;
  	}
  	else
  	{
  	element.source = newNodeArray.indexOf(n[element.source].name);
  	}
  	if(newNodeArray.indexOf(n[element.target].name) === -1)
  	{
  	insertedAt = newNodeArray.length;
  		newNodeArray[insertedAt] = n[element.target].name;
  		element.target = insertedAt;
  	}
  	else
  	{
  	element.target = newNodeArray.indexOf(n[element.target].name);
  	}
  });
  newMap.links = l;
  
  newNodeArray.forEach(function(element, index, array){
  newMap.nodes.push({ "name" : element, "id" : index});
  });
  
  return newMap;
}

function GetResume(callback){
	d3.json("/testdata/arvind.txt", function(res){
		resume = res;
		if(resume)
			if(callback)
				callback();
	});
}

function GetMapByCompany(companyName)
{
	if (!resume) {
		GetResume(function(){
			GetMapByCompany(companyName);
		});
	}
	else {
		var newLink = {
			"source": null,
			"target": null,
			"value": null
		};
		var newMap = {
			"nodes": [],
			"links": []
		};
		var newNodeArray = [];
		var sourceId = -1;
		var targetId = -1;
		resume.Jobs.forEach(function(Job, JobIndex, JobArray){
			if (Job.JobCompany === companyName) {
				Job.JobProjects.forEach(function(JobProject, JobProjectindex, JobProjectArray){
					var JobTitleId = GetIndex(newNodeArray, Job.JobTitle);
					var ProjectNameId = GetIndex(newNodeArray, JobProject.ProjectName);
					AddLink(newMap.links, JobTitleId, ProjectNameId, 50);
					JobProject.ProjectTechnologyTags.forEach(function(PTag, PTagIndex, PTagArray){
						var ProjectActivityTagId = GetIndex(newNodeArray, PTag.ProjectActivityTag);
						AddLink(newMap.links, ProjectNameId, ProjectActivityTagId, 50);
						var ProjectTagId = GetIndex(newNodeArray, PTag.Tag);
						AddLink(newMap.links, ProjectActivityTagId, ProjectTagId, PTag.Percentage);
					});
				});
			}
		});
		newNodeArray.forEach(function(element, index, array){
			newMap.nodes.push({
				"name": element,
				"id": index
			});
			
		});
		
		DrawSankey(newMap);
	}
}

function GetMapOnInit()
{
	if (!resume) {
		GetResume(function(){
			GetMapOnInit();
		});
	}
	else {
		var newLink = {
			"source": null,
			"target": null,
			"value": null
		};
		var newMap = {
			"nodes": [],
			"links": []
		};
		var newNodeArray = [];
		var sourceId = -1;
		var targetId = -1;
		var EducationId = GetIndex(newNodeArray, "Education");
		resume.Education.forEach(function(Education, EdIndex, EducationArray){
			var EducationSchoolId = GetIndex(newNodeArray, Education.School);
			AddLink(newMap.links, EducationId, EducationSchoolId, 50);
			var EducationDegreeId = GetIndex(newNodeArray, Education.DegreeAttained + " " + Education.Specialization);
			AddLink(newMap.links, EducationSchoolId, EducationDegreeId, 50);
			});
		
		var EmploymentId = GetIndex(newNodeArray, "Employment");
		resume.Jobs.forEach(function(Job, JobIndex, JobArray){
					var JobCompanyId = GetIndex(newNodeArray, Job.JobCompany);
					AddLink(newMap.links, EmploymentId, JobCompanyId, 50);
				Job.JobProjects.forEach(function(JobProject, JobProjectindex, JobProjectArray){
					var JobTitleId = GetIndex(newNodeArray, Job.JobTitle);
					AddLink(newMap.links, JobCompanyId, JobTitleId, 50);
					JobProject.ProjectTechnologyTags.forEach(function(PTag, PTagIndex, PTagArray){
						var ProjectActivityTagId = GetIndex(newNodeArray, PTag.ProjectActivityTag);
						AddLink(newMap.links, JobTitleId, ProjectActivityTagId, 50);
					});
				});
		});
		newNodeArray.forEach(function(element, index, array){
			newMap.nodes.push({
				"name": element,
				"id": index
			});
			
		});
		
		DrawSankey(newMap);
	}
}

function GetMapToolkit()
{
	if (!resume) {
		GetResume(function(){
			GetMapToolkit();
		});
	}
	else {
		var newLink = {
			"source": null,
			"target": null,
			"value": null
		};
		var newMap = {
			"nodes": [],
			"links": []
		};
		var newNodeArray = [];
		var sourceId = -1;
		var targetId = -1;
		/*
		var EducationId = GetIndex(newNodeArray, "Education");
		resume.Education.forEach(function(Education, EdIndex, EducationArray){
			var EducationSchoolId = GetIndex(newNodeArray, Education.School);
			AddLink(newMap.links, EducationId, EducationSchoolId, 50);
			var EducationDegreeId = GetIndex(newNodeArray, Education.DegreeAttained + " " + Education.Specialization);
			AddLink(newMap.links, EducationSchoolId, EducationDegreeId, 50);
			});
		*/
		var EmploymentId = GetIndex(newNodeArray, "Employment");
		resume.Jobs.forEach(function(Job, JobIndex, JobArray){
					var JobCompanyId = GetIndex(newNodeArray, Job.JobCompany);
					AddLink(newMap.links, EmploymentId, JobCompanyId, 50);
				Job.JobProjects.forEach(function(JobProject, JobProjectindex, JobProjectArray){
					var JobTitleId = GetIndex(newNodeArray, Job.JobTitle);
					AddLink(newMap.links, JobCompanyId, JobTitleId, 50);
					JobProject.ProjectToolkitTags.forEach(function(PTag, PTagIndex, PTagArray){
						var ProjectTookkitTagId = GetIndex(newNodeArray, PTag.Tag);
						AddLink(newMap.links, JobTitleId, ProjectTookkitTagId, 50);
					});
				});
		});
		newNodeArray.forEach(function(element, index, array){
			newMap.nodes.push({
				"name": element,
				"id": index
			});
			
		});
		
		DrawSankey(newMap);
	}
}

function GetIndex(array, element){
	var insertedAt = array.indexOf(element);
	if(insertedAt === -1)
  	{
  		insertedAt = array.length;
  		array[insertedAt] = element;
  	}
  	return insertedAt;
}

function AddLink(array, sourceId, targetId, value){
	var found = false;
	array.forEach(function(el, index, arr){
		if(el.source === sourceId && el.target == targetId)
			found = true;
	});
	if(!found)
		array[array.length] = {"source": sourceId, "target": targetId, "value" : value };
	return array;
}

/*
d3.json("energy.json", function(energy) {

//var x = PruneMap(energy.nodes, energy.links);
  //DrawSankey(x);

});
*/

function DrawSankey(map)
{
	d3.selectAll(".link").remove();
	d3.selectAll(".node").remove();
	
	var _n = map.nodes;
    var _l = map.links;

  sankey
      .nodes(_n)
      .links(_l)
      .layout(32);

  var link = svg.append("g").selectAll(".link")
      .data(_l);
      
  var node = svg.append("g").selectAll(".node")
      .data(_n);
    
    AddPath(link);
    DrawPath(link);  
    AddNode(node);
    DrawNode(node);
    //DragNode(node,link);
}


