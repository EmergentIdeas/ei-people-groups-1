const webhandle = require('webhandle')
const commingle = require('commingle')
const usersSetup = require('webhandle-users/integrate-with-webhandle')
const path = require('path')
const express = require('express');

const PeopleGroupsDreck = require('./people-groups-dreck')

let integrate = function(dbName, options) {
	let opt = Object.assign({
		collectionName: 'peoplegroups',
		templateDir: 'node_modules/@dankolz/ei-people-groups-1/views',
		mountPoint: '/peoplegroups',
		allowedGroups: ['administrators'],
		dreckOptions: {}
	}, options || {})

	if(!webhandle.dbs[dbName].collections.peoplegroups) {
		webhandle.dbs[dbName].collections.peoplegroups = webhandle.dbs[dbName].db.collection(opt.collectionName)
	}
	

	if(!opt.dreckOptions.mongoCollection) {
		opt.dreckOptions.mongoCollection = webhandle.dbs[dbName].collections.peoplegroups
	}
	let peoplegroups = new PeopleGroupsDreck(opt.dreckOptions)
	
	let peoplegroupsRouter = peoplegroups.addToRouter(express.Router())
	let securedpeoplegroupsRouter = require('webhandle-users/utils/allow-group')(
		['administrators'],
		peoplegroupsRouter
	)
	webhandle.routers.primary.use(opt.mountPoint, securedpeoplegroupsRouter)
	if(!webhandle.drecks) {
		webhandle.drecks = {}
	}
	webhandle.drecks['peoplegroups'] = peoplegroups
	
	if(opt.templateDir) {
		webhandle.addTemplateDir(path.join(webhandle.projectRoot, opt.templateDir))
	}
	
	webhandle.pageServer.preRun.push((req, res, next) => {
		let pageName 
		let parts = req.path.split('/')
		do {
			pageName = parts.pop()
			
		} while(!pageName && parts.length > 0);

		if(!pageName) {
			pageName = 'index'
		}
		
		if(res.locals.page.peopleGroups) {
			let groupsTotal = 0
			let groupsLoaded = 0
			if(res.locals.page.peopleGroups.loadPageNameGroup) {
				groupsTotal++
				webhandle.dbs[dbName].collections.peoplegroups.findOne({name: pageName}, (err, result) => {
					if(err) {
						log.error(err)
					}
					else if(result){
						res.locals.page.people = result.people
					}
					groupsLoaded++
					if(groupsTotal == groupsLoaded) {
						next()
					}
				})
			}
			if(res.locals.page.peopleGroups.loadNames) {
				let names = res.locals.page.peopleGroups.loadNames
				if(typeof names == 'string') {
					names = [names]
				}
				for(let name of names) {
					groupsTotal++
					webhandle.dbs[dbName].collections.peoplegroups.findOne({name: name}, (err, result) => {
						if(err) {
							log.error(err)
						}
						else if(result){
							if(!res.locals.peopleGroups) {
								res.locals.peopleGroups = {}
							}
							res.locals.peopleGroups[name] = result
						}
						groupsLoaded++
						if(groupsTotal == groupsLoaded) {
							next()
						}
					})
				}
			}
			if(groupsTotal == groupsLoaded) {
				next()
			}

		}
		else {
			return next()
		}
	})
	
}

module.exports = integrate
