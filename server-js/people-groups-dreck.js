const Dreck = require('dreck')
let webhandle = require('webhandle')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('underscore')
const commingle = require('commingle')
const addCallbackToPromise = require('dreck/add-callback-to-promise')

const formInjector = require('form-value-injector')
const simplePropertyInjector = require('dreck/binders/simple-property-injector')


class PeopleGroupsDreck extends Dreck {
	constructor(options) {
		super(options)
		let curDreck = this
		_.extend(this, 
			{
				templatePrefix: 'ei-people-group-1/people/',
				locals: {
					pretemplate: 'app_pre',
					posttemplate: 'app_post'
				},
				injectors: [
					(req, focus, next) => {
						simplePropertyInjector(req, focus, curDreck.bannedInjectMembers, next)
					}
				]
			}
		)
	}
	
	validateCreate(req, res, focus, callback) {
		let p = new Promise((resolve, reject) => {
			if(!focus.people) {
				focus.people = []
			}
			resolve(focus)
		})		
		return addCallbackToPromise(p, callback)
	}
	
	editPersonGET(req, res, next) {
		this.fetch(this.createQuery(req, res))
		.then((focus) => {
			_.extend(res.locals, this.locals)
			if(!focus || focus.length == 0) {
				this.log.error('Missing for edit screen: ' + req.originalUrl)
				this.prepLocals(req, res)
				res.render(this.templatePrefix + this.templates.missing)
			}
			else {
				let orgFocus = focus[0]
				focus = (focus[0].people || []).filter(person => person.id == req.params.personId)
				this.prepLocals(req, res, orgFocus, focus[0])
				res.locals.dreck.title = this.editTitle(focus[0])
				this.addFormInjector(req, res, focus[0])
				res.render(this.templatePrefix + 'people-edit')
			}
		})
	}
	
	createPersonGET(req, res, next) {
		this.fetch(this.createQuery(req, res))
		.then((focus) => {
			_.extend(res.locals, this.locals)
			if(!focus || focus.length == 0) {
				this.log.error('Missing for edit screen: ' + req.originalUrl)
				this.prepLocals(req, res)
				res.render(this.templatePrefix + this.templates.missing)
			}
			else {
				let orgFocus = focus[0]
				focus = (focus[0].people || []).filter(person => person.id == req.params.personId)
				this.prepLocals(req, res, orgFocus, focus[0])
				res.locals.dreck.title = this.editTitle(focus[0])
				this.addFormInjector(req, res, focus[0])
				res.render(this.templatePrefix + 'people-create')
			}
		})
	}
	
	modifyPersonPOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.people) {
				focus.people = []
			}
			let orgFocus = focus
			let personIndex
			for(let i = 0; i < focus.people.length; i++) {
				if(focus.people[i].id == req.params.personId) {
					personIndex = i
					focus = focus.people[i]
					break;
				}
			}
			this.updateFocus(req, res, focus).then((updated) => {
				orgFocus.people[personIndex] = updated
				this.validateModify(req, res, orgFocus).then((validated) => {
					this.save(validated).then(() => {
						res.redirect(req.baseUrl + '/' + orgFocus._id + '/edit')
					}).catch((err) => {
						this.log.error(err)
						next(err)
					})
				}).catch((err) => {
					this.log.error(err)
					this.prepLocals(req, res, orgFocus, updated)
					res.locals.dreck.title = this.editTitle(updated)
					this.addFormInjector(req, res, updated)
					res.render(this.templatePrefix + this.templates.edit)
				})
			})
		})
	}
	
	createPersonPOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.people) {
				focus.people = []
			}
			let orgFocus = focus
			let personIndex
			focus = {}
			// for(let i = 0; i < focus.people.length; i++) {
			// 	if(focus.people[i].id == req.params.personId) {
			// 		personIndex = i
			// 		focus = focus.people[i]
			// 		break;
			// 	}
			// }
			this.updateFocus(req, res, focus).then((updated) => {
				orgFocus.people.push(updated)
				updated.id = uuidv4()
				this.validateCreate(req, res, orgFocus).then((validated) => {
					this.save(validated).then(() => {
						res.redirect(req.baseUrl + '/' + orgFocus._id + '/edit')
					}).catch((err) => {
						this.log.error(err)
						next(err)
					})
				}).catch((err) => {
					this.log.error(err)
					this.prepLocals(req, res, orgFocus, updated)
					res.locals.dreck.title = this.editTitle(updated)
					this.addFormInjector(req, res, updated)
					res.render(this.templatePrefix + this.templates.edit)
				})
			})
		})
	}

	
	sortPeoplePOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.people) {
				focus.people = []
			}
			focus.people = focus.people.sort((one, two) => {
				try {
					let o1 = parseInt(req.body[one.id] || 0)
					let o2 = parseInt(req.body[two.id] || 0)
					if(o1 < o2) {
						return -1
					}
					if(o1 > o2) {
						return 1
					}
					return 0
				}
				catch(e) {
					return 0
				}
				
			})
			this.save(focus).then(() => {
				res.end('success')
			}).catch((err) => {
				this.log.error(err)
				next(err)
			})
		})
	}


	deletePersonPOST(req, res, next) {
		this.fetch(this.createQuery(req, res)).then((focus) => {
			if(Array.isArray(focus)) {
				if(focus.length == 1) {
					focus = focus[0]
				}
				else {
					next(new Error('Could not find object with id ' + req.params.focusId))
				}
			}
			if(!focus.people) {
				focus.people = []
			}
			focus.people = (focus.people || []).filter(person => person.id != req.params.personId)

			this.save(focus).then(() => {
				res.redirect(req.baseUrl + '/' + focus._id + '/edit')
			}).catch((err) => {
				this.log.error(err)
				next(err)
			})
		})
	}

	prepLocals(req, res, focus, subfocus) {
		if(!subfocus) {
			subfocus = focus
		}
		_.extend(res.locals, this.locals)
		let dvars = res.locals.dreck = {}
		dvars.baseUrl = req.baseUrl
		dvars.newUrl = req.baseUrl + this.urls.new[0]
		dvars.createUrl = req.baseUrl + this.urls.create[0]
		dvars.editPrefix = req.baseUrl
		dvars.deletePrefix = req.baseUrl
		if(dvars.editPrefix.lastIndexOf('/') != dvars.editPrefix.length - 1) {
			dvars.editPrefix += '/'
		}
		dvars.deleteSuffix
		
		if(subfocus) {
			res.locals.focus = subfocus
		}
		if(focus) {
			if(!Array.isArray(focus)) {
				dvars.modifyUrl = req.baseUrl + this.urls.modify[0].replace(':focusId', this.getFocusId(focus))
				dvars.editUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus))
				dvars.createPeopleUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus)) + "/person/create"
				dvars.sortPeopleUrl = req.baseUrl + this.urls.edit[0].replace(':focusId', this.getFocusId(focus)) + "/people/sort"
			}
		}
		else {
			
		}
	}
	
	addToRouter(router) {
		super.addToRouter(router)
		router.get(this.urls.edit + '/person/create', this.createPersonGET.bind(this))
		router.post(this.urls.edit + '/person/create', this.createPersonPOST.bind(this))
		router.get(this.urls.edit + '/person/:personId/edit', this.editPersonGET.bind(this))
		router.post(this.urls.modify + '/person/:personId/edit', this.modifyPersonPOST.bind(this))
		router.post(this.urls.modify + '/person/:personId/delete', this.deletePersonPOST.bind(this))
		router.post(this.urls.modify + '/people/sort', this.sortPeoplePOST.bind(this))
		return router
	}
}

module.exports = PeopleGroupsDreck