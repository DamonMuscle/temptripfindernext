(function()
{
	createNamespace("TF.Grid").BaseMapPopup = BaseMapPopup;

	function BaseMapPopup(options)
	{
		this.options = $.extend({
			isDetailView: false,
			gridType: "",
			dbId: "",
			canShowDetailView: true,
			enableHyperlink: true,
			enableEdit: true,
			viewDetailEvent: function() { }
		}, options);
		this.viewModel = {};
		this.eventNameSpace = `callout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		this.dataModels = [];
		this.pageIndex = 0;
		this.selectedTabIndex = 0;
		this.subContentMinHeight = 68;
	}

	BaseMapPopup.prototype.buildContent = function()
	{
		const self = this;
		let index = self.pageIndex,
			pagerString = "",
			photoString = "",
			subTitleString = "",
			contentString = "",
			entityCount = self.dataModels.length,
			dataModel = self.dataModels[index],
			content = self.generatePopupContent(dataModel),
			contentExtend = "",
			coverFloat = "";

		if (entityCount > 1)
		{
			pagerString = `<div class='head-pager'>
								<div class='page-group'>
									<div class='page-indicator none-select'>${(index + 1)} of ${entityCount}</div>
									<div entityIndex='${index}' class='left-caret page-previous ${(index == 0 ? "useable" : "")}'></div>
									<div entityIndex='${index}' class='right-caret page-next ${index == entityCount - 1 ? "useable" : ""}'></div>
								</div>
							</div>`;
		}

		if (content.photo)
		{
			photoString = `<div class="photo back"></div>
						   <div class="cover"></div>
						   <div class="photo none-select no-image">${content.photo}</div>
						   ${entityCount == 1 ? '<div class="head-pager"></div>' : ""}`;
		}

		if (content.contentExtend)
		{
			var tabHeaderItems = [];
			var tabSubContentItems = [];
			content.contentExtend.forEach(function(item, index)
			{
				var cssClass = "";
				if (index == 0)
				{
					cssClass += " first ";
				}
				// when only 1 tab, it's the first, and it's the last meanwhile.
				if (index == content.contentExtend.length - 1)
				{
					cssClass += " last ";
				}
				if (index == self.selectedTabIndex)
				{
					cssClass += " select ";
				}
				var role = item.name.toLowerCase().replace(/\s/g, "");
				tabHeaderItems.push(`<li data-role="${role}" class="${cssClass}">${item.name}</li>`);
				tabSubContentItems.push(`<div class="sub-content ${cssClass}" data-role="${role}">${item.content}</div>`);
			});
			var tabHeader = `<div class="tab-header none-select">
								<ul>
									${tabHeaderItems.join("")}
								</ul>
							</div>`;
			var tabContent = `<div class="tab-content">${tabSubContentItems.join("")}</div>`;
			contentExtend = `<div class="content-extend">${tabHeader + tabContent}</div>`;
		}

		if (content.subTitle)
		{
			subTitleString = `<div class="detail-right">${content.subTitle}</div>`;
		}

		if (content.subTitleBelow)
		{
			subTitleString = `<div>${content.subTitleBelow}</div>`;
			coverFloat = 'cover-float ';
		}

		if (content.contentMain || contentExtend)
		{
			contentString = `<div class="content">${content.contentMain + contentExtend}</div>`;
			// $(this.map.mapView.popup.container).removeClass("no-content");
		}
		// else
		// {
		//	 $(this.map.mapView.popup.container).addClass("no-content");
		// }

		var canShowDetailView = this.options.canShowDetailView;
		// if (this.viewModel.parentDocument)
		// {
		//	 canShowDetailView = this.viewModel.parentDocument.gridViewModel.obCanShowDetailView();
		// }

		// if (this.viewModel.viewie && this.viewModel.viewie.type === "gpsevent")
		// {
		//	 canShowDetailView = false;
		// }

		// const mapPopup = {};

		// if (mapPopup.disableTitleLink)
		// {
		// 	canShowDetailView = false;
		// }

		var title = `<div class="detail-left ${coverFloat} ${canShowDetailView ? "" : "disable"} ellipsis' title="${content.title}">${content.title}</div>`;
		// let mapPopupType = mapPopup.options ? mapPopup.options.type : mapPopup.type
		// if (this.options.enableHyperlink &&
		//	 this.options.gridType != mapPopupType &&
		//	 content.link != false &&
		//	 dataModel.Id)
		// {
		//	 title = "<div class='detail-left drill-down-links " + coverFloat + "' data-outname='" + content.title + "' data-outtype='" + this.options.gridType + "' data-type='" + mapPopupType + "' data-entityindex='" + dataModel.Id + "'>" + content.title + "</div>";
		// }
		return $(`<div class="tfweb-esri-popup-container">
					<div class="head">
						${photoString}
						${pagerString}
						<div class="head-details clearfix">
							${title}
							${subTitleString}
						</div>
					</div>
					${contentString}
				</div>`)[0];
	}

	BaseMapPopup.prototype.generatePopupContent = function(data)
	{
		const self = this;
		//return content elements
		if (self.options.isDetailView) // currently self.options.isDetailView is not available, using self.options.parentPage.detailView as alternative
		{
			return {
				title: self.buildDetailViewTitle(data),
				contentMain: self.buildDetailViewContentMain(data)
			};
		}
		else
		{
			return {
				photo: self.buildPhoto(data),
				title: self.buildTitle(data),
				subTitle: self.buildSubTitle(data),
				contentMain: self.buildContentMain(data),
				contentExtend: self.buildContentExtend(data)
			};
		}
	};

	BaseMapPopup.prototype.buildDetailViewTitle = function(data)
	{
		return this.buildTitle(data);
	};

	BaseMapPopup.prototype.buildDetailViewContentMain = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildPhoto = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildTitle = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildSubTitle = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildContentMain = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildContentExtend = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.createNotesTabHtml = function(type, notes, dataType)
	{
		const self = this,
			enableEdit = self.options.enableEdit,
			permission = tf.authManager.isAuthorizedFor(dataType, "edit");

		notes = notes || "";

		let tabHtml = `<div class='module full-width ellipsis'>
							<textarea class='${(enableEdit ? "editable" : "non-editable")}' ${permission ? "rows='4'" : ""} readonly>${notes}</textarea>
						</div>`;

		if (permission)
		{
			tabHtml += self.getEmptySegmentedPageString(type, "notes", true);
			tabHtml += enableEdit ? `<div class='notes-control'>
										<button class='addNote'>Add Note</button>
										<button class='saveEdit'>Save Note</button>
										<button class='cancelEdit'>Cancel</button>
									</div>` : "";

			return `<div class='notes-tab ${notes ? "" : " empty-note"}'>
						<div class='center-container'>
							${tabHtml}
						</div>
					</div>`;
		}
		else
		{
			return notes ? `<div class='notes-tab'>
								<div class='center-container no-permission'>
									${tabHtml}
								</div>
							</div>` : self.getEmptySegmentedPageString(type, "notes");
		}
	};

	BaseMapPopup.prototype.getEmptySegmentedPageString = function(type, segmentedName, notCenter)
	{
		var html = `<div class='empty'>
						No ${segmentedName} for this ${type}
					</div>`;
		if (!notCenter)
		{
			html = `<div class='empty-content'>${html}</div>`;
		}
		return html;
	};

	BaseMapPopup.prototype.show = function(graphics, data)
	{
		const self = this,
			ids = (graphics || []).map(x=>x.attributes && x.attributes.Id).filter(Boolean);

		let p = data ? Promise.resolve(data): self.getData(ids).then(response => response.Items || []);

		p.then(function(dataModels)
		{
			self.dataModels = dataModels;
			self.popupContainer = self.options.map.showPopup({
				content: self.buildContent(),
				location: graphics[0].geometry,
			});
			self._addDetailViewStyle();

			setTimeout(function()
			{
				self._updateSubContentHeight();
				self.bindEvents();
			}, 100);
		});
	};

	BaseMapPopup.prototype._addDetailViewStyle = function()
	{
		var self = this;
		if (self.options.isDetailView)
		{
			$(self.popupContainer).addClass("detail-view-popup");
		}
	};

	BaseMapPopup.prototype.bindEvents = function()
	{
		const self = this, $popupContainer = $(self.popupContainer);
		$popupContainer.on(`click.${self.eventNameSpace}`, ".page-previous", self.prevClick.bind(self));
		$popupContainer.on(`click.${self.eventNameSpace}`, ".page-next", self.nextClick.bind(self));
		$popupContainer.on(`click.${self.eventNameSpace}`, ".detail-left:not(.disable,.drill-down-links)", function()
		{
			var id = self.dataModels[self.pageIndex].Id;
			self.options.viewDetailEvent(id);
		});
		this._bindNoteEvent($popupContainer, self.options ? self.options.type : self.type);
	};

	BaseMapPopup.prototype._bindNoteEvent = function($popupContainer, featureType)
	{
		var self = this;
		$popupContainer.delegate("button.addNote,button.saveEdit,button.cancelEdit,textarea", `click.${self.eventNameSpace}`, function(e)
		{
			var $notesTab = $popupContainer.find(".notes-tab");
			var $target = $(e.currentTarget);
			if (!$notesTab.find(".center-container").hasClass("no-permission"))
			{
				if ($target.hasClass("addNote"))
				{
					addNewNoteClick();
				}
				else if ($target.hasClass("saveEdit"))
				{
					saveEditNoteClick();
				}
				else if ($target.hasClass("cancelEdit"))
				{
					cancelEditNoteClick();
				}
				else if ($target.is("textarea"))
				{
					openNotesEditMode();
				}
			}
		});

		function addNewNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab");
			self.tempEditNote = null;
			self.switchEditNoteStatus($notesTab);
		}

		function saveEditNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				note = $notesTab.find("textarea").val(),
				entityId = self.dataModels[self.pageIndex].Id;

			self.saveEntityNotes(featureType, entityId, note)
				.then(function()
				{
					const noteField = self._getNoteField(featureType);
					self.dataModels[self.pageIndex][noteField] = note;
					self.switchEditNoteStatus($notesTab);
				});
		}

		function cancelEditNoteClick()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				$textArea = $notesTab.find("textarea");

			$textArea.val(self.tempEditNote);
			self.switchEditNoteStatus($notesTab);
		}

		function openNotesEditMode()
		{
			var $notesTab = $popupContainer.find(".notes-tab"),
				$textArea = $notesTab.find("textarea"),
				isEditing = $notesTab.hasClass("edit-note");

			self.tempEditNote = $textArea.val();
			if (!isEditing)
			{
				self.switchEditNoteStatus($notesTab);
			}
		}
	};

	/**
	 * Save the entity note to the DB.
	 * @param {string} type The entity type.
	 * @param {number} id The entity id.
	 * @param {string} comment The comment to be saved.
	 * @return {Promise} The save process.
	 */
	BaseMapPopup.prototype.saveEntityNotes = function(type, id, comment)
	{
		var field = this._getNoteField(type);
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(),
			tf.dataTypeHelper.getEndpoint(type)) + "?id=" + id, {
			data: [
				{ "op": "replace", "path": "/" + field, "value": comment }
			]
		});
	};

	/**
	 * Switch the activeness status of the notes.
	 * @param {JQuery} $notesTab The notes tab jQuery object.
	 * @param {boolean} status The desired status after switch.
	 * @return {void}
	 */
	BaseMapPopup.prototype.switchEditNoteStatus = function($notesTab)
	{
		var self = this,
			$textArea = $notesTab.find("textarea"),
			isEditing = $notesTab.hasClass("edit-note"),
			isEmpty = !$textArea.val();

		if (isEditing)
		{
			$textArea.prop("readonly", true);
			$notesTab.removeClass("edit-note");
			$notesTab.toggleClass("empty-note", isEmpty);
			self._updateSubContentHeight();
		}
		else
		{
			$textArea.prop("readonly", false);
			$notesTab.addClass("edit-note");
			self._updateSubContentHeight();
			$textArea.focus();
		}
	};

	BaseMapPopup.prototype._getNoteField = function(type)
	{
		if(type === 'fieldtriplocation')
		{
			return "Notes";
		} else if (type === "tripstop")
		{
			return "Comment";
		}
		return "Comments";
	}

	BaseMapPopup.prototype.changeItem = function()
	{
		this.options.map.updatePopup(this.buildContent())
	}

	BaseMapPopup.prototype.close = function()
	{
		const self = this;
		self.options.map.closePopup();
		$(self.popupContainer).off(`.${self.eventNameSpace}`)
		self.pageIndex = 0;
		self.selectedTabIndex = 0;
	}
	
	BaseMapPopup.prototype.prevClick = function(e)
	{
		if (this.pageIndex === 0)
		{
			return;
		}
		this.pageIndex--
		this.changeItem();
		this._updateSubContentHeight();
	}

	BaseMapPopup.prototype.nextClick = function(e)
	{
		if (this.pageIndex === this.dataModels.length -1)
		{
			return;
		}
		this.pageIndex++
		this.changeItem();
		this._updateSubContentHeight();
	}

	BaseMapPopup.prototype._updateSubContentHeight = function()
	{
		if (this.options.isDetailView || this.options.gridType == "gpsevent")
		{
			return;
		}

		var self = this,
			$popupContainer = $(self.popupContainer),
			$subContents = $popupContainer.find(".sub-content"),
			maxHeight = 0;
		if ($subContents.length == 0)
		{
			return;
		}
		var popupContainerClientRect = $popupContainer[0].getBoundingClientRect(),
			subContentClientRect = $subContents[0].getBoundingClientRect(),
			bodyHeight = $("body").height(),
			subContentMaxHeight;

		if ($popupContainer.attr("class").indexOf("-top-") >= 0)
		{
			// the content can not higher than body top 
			subContentMaxHeight = popupContainerClientRect.bottom - 250;
		}
		else 
		{
			// the content can not lower than body bottom 
			subContentMaxHeight = bodyHeight - subContentClientRect.top - 50;
		}

		// can not higher than max height of content
		// if the max height less than min height means the popup content outsite the window, so the max height is 285,
		subContentMaxHeight = subContentMaxHeight > self.subContentMinHeight ? Math.min(subContentMaxHeight, 285) : 285;

		$subContents.each(function(index, item)
		{
			var height = 0;
			var $subContent = $(item);
			var hasSelected = $subContent.hasClass("select");
			$subContent.addClass("select").css({ "height": "auto" });
			height = $subContent.outerHeight();
			if (!hasSelected)
			{
				$subContent.removeClass("select");
			}
			if (height > subContentMaxHeight)
			{
				$subContent.addClass("auto-width main-part");
			}
			else
			{
				$subContent.removeClass("auto-width main-part");
			}
			height = Math.min(Math.max(height, self.subContentMinHeight), subContentMaxHeight);
			if (height > maxHeight)
			{
				maxHeight = height;
			}
		});
		$subContents.height(maxHeight > subContentMaxHeight ? subContentMaxHeight : maxHeight);
	};

	BaseMapPopup.prototype.focusRecord = function(recordId, graphics)
	{
		const self = this;

		self.getData([recordId]).then(function(response)
		{
			const [record] = response.Items;
			if (!record.XCoord || !record.YCoord || record.XCoord == 0 || record.YCoord == 0)
			{
				return;
			}

			self.options.map.centerAndZoom(record.XCoord, record.YCoord, 3000);
			self.show(graphics.filter(x=>x.attributes.Id == recordId), [record]);
		});
	}

	BaseMapPopup.prototype.dispose = function()
	{

	}
})();