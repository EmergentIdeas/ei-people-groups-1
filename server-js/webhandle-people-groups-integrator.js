const webhandle = require('webhandle')
const commingle = require('commingle')
const usersSetup = require('webhandle-users/integrate-with-webhandle')
const path = require('path')
const express = require('express');

const PeopleGroupsDreck = require('./people-groups-dreck')

let integrate = function(dbName) {
	if(!webhandle.dbs[dbName].collections.peoplegroups) {
		webhandle.dbs[dbName].collections.peoplegroups = webhandle.dbs[dbName].db.collection('peoplegroups')
	}
	
	let peoplegroups = new PeopleGroupsDreck({
		mongoCollection: webhandle.dbs[dbName].collections.peoplegroups,
	})
	
	let peoplegroupsRouter = peoplegroups.addToRouter(express.Router())
	let securedpeoplegroupsRouter = require('webhandle-users/utils/allow-group')(
		['administrators'],
		peoplegroupsRouter
	)
	webhandle.routers.primary.use('/peoplegroups', securedpeoplegroupsRouter)
	
	webhandle.addTemplateDir(path.join(webhandle.projectRoot, 'node_modules/@dankolz/ei-people-groups-1/views'))
	
	webhandle.pageServer.preRun.push((req, res, next) => {
		let pageName 
		let parts = req.path.split('/')
		do {
			pageName = parts.pop()
			
		} while(!pageName && parts.length > 0);

		if(!pageName) {
			pageName = 'index'
		}
		webhandle.dbs[dbName].collections.peoplegroups.findOne({name: pageName}, (err, result) => {
			if(err) {
				log.error(err)
			}
			else if(result){
				res.locals.page.people = result.people
			}
			next()
		})
	})
	
}

module.exports = integrate