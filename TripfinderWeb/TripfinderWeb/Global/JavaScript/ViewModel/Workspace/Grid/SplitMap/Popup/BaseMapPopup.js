(function()
{
	createNamespace("TF.Grid").BaseMapPopup = BaseMapPopup;

	function BaseMapPopup(options)
	{
		this.options = options;
		this.viewModel = {};
		this.eventNameSpace = `callout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		this.list = null;
		this.index = 0;
		this.selectedTabIndex = 0;
		this.subContentMinHeight = 68;
	}

	BaseMapPopup.prototype.buildContent = function()
	{
		const self = this;
		let index = self.index,
			pagerString = "",
			photoString = "",
			subTitleString = "",
			contentString = "",
			entityCount = self.list.length,
			dataModel = self.list[index],
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
		return `<div class="tfweb-esri-popup-container">
					<div class="head">
						${photoString}
						${pagerString}
						<div class="head-details clearfix">
							${title}
							${subTitleString}
						</div>
					</div>
					${contentString}
				</div>`;
	}

	BaseMapPopup.prototype.generatePopupContent = function(data)
	{
		const self = this;
		//return content elements
		if (self.options.isDetailView)
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

		p.then(function(list)
		{
			self.list = list;
			self.popupContainer = self.options.map.showPopup({
				content: self.buildContent(),
				location: graphics[0].geometry,
			});

			setTimeout(function()
			{
				self._updateSubContentHeight();
				self.bindEvents();
			}, 100);
		});
	};

	BaseMapPopup.prototype.bindEvents = function()
	{
		const self = this;
		$(self.popupContainer).on(`click.${self.eventNameSpace}`, ".page-previous", self.prevClick.bind(self));
		$(self.popupContainer).on(`click.${self.eventNameSpace}`, ".page-next", self.nextClick.bind(self));
		$(self.popupContainer).on(`click.${self.eventNameSpace}`, ".detail-left:not(.disable,.drill-down-links)", function()
		{
			var id = self.list[self.index].Id;
			self.options.parentPage.showDetailsClick(id);
		});
	};

	BaseMapPopup.prototype.changeItem = function()
	{
		this.options.map.updatePopup(this.buildContent())
	}

	BaseMapPopup.prototype.close = function()
	{
		const self = this;
		self.options.map.closePopup();
		$(self.popupContainer).off(`.${self.eventNameSpace}`)
		self.index = 0;
		self.selectedTabIndex = 0;
	}
	
	BaseMapPopup.prototype.prevClick = function(e)
	{
		if (this.index === 0)
		{
			return;
		}
		this.index--
		this.changeItem();
		this._updateSubContentHeight();
	}

	BaseMapPopup.prototype.nextClick = function(e)
	{
		if (this.index === this.list.length -1)
		{
			return;
		}
		this.index++
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