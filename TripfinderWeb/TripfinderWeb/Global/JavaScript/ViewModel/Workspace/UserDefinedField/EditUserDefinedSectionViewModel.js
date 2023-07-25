(function()
{
	createNamespace("TF.UserDefinedField").EditUserDefinedSectionViewModel = EditUserDefinedSectionViewModel;

	function EditUserDefinedSectionViewModel(options)
	{
		var self = this;
		self.gridType = options.gridType;
		self.isEdit = options.dataEntity != null && !options.dataEntity.isCopy;
		self.isCopy = options.dataEntity != null && options.dataEntity.isCopy;
		self.dataEntity = options.dataEntity;
		self.dataEntity.RoleSections = JSON.parse(JSON.stringify(options.dataEntity.RoleSections)); // deep colon role sections to avoid public role setting impact the parent control;
		self.isUDFGroup = options.isUDFGroup;
		self.isPublicForm = options.isPublic;
		self.udGridId = options.udGridId;
		self.sequence = options.sequence;

		self._setPublicRoleSection(self.dataEntity, self.isPublicForm);

		self.obName = ko.observable((self.isEdit || self.isCopy) ? self.dataEntity.Name : null);
		self.canAssignRole = ko.observable(tf.authManager.hasFormsGridAccess('save'));
	};



	EditUserDefinedSectionViewModel.prototype._setPublicRoleSection = function(section, isPublicForm)
	{
		if (!isPublicForm || !section.IsPublic)
		{
			return;
		}

		const isNotAssignedAllRoles = section.RoleSections.length > 0;
		if (isNotAssignedAllRoles)
		{
			if (!section.RoleSections.find(r => r.RoleID == PUBLIC_ROLE_KEY))
			{
				section.RoleSections.splice(1, 0, { RoleID: PUBLIC_ROLE_KEY });
			}

			if (!section.HasRole.indexOf(r => r == PUBLIC_ROLE_KEY) >= 0)
			{
				section.HasRole.splice(1, 0, PUBLIC_ROLE_KEY);
			}
		}
	}

	const ADMIN_ROLE_KEY = -999;
	const PUBLIC_ROLE_KEY = 0;
	const DEFAULT_PRIVATE_ROLES_KEYS = [ADMIN_ROLE_KEY];
	const DEFAULT_PUBLIC_ROLES_KEYS = [ADMIN_ROLE_KEY, PUBLIC_ROLE_KEY];
	const ADMIN_ROLE_ITEM = { text: "Administrator", value: ADMIN_ROLE_KEY };

	EditUserDefinedSectionViewModel.prototype.init = function(vm, el)
	{
		var self = this;
		self.$element = $(el);
		self.$element.parent().scroll(() =>
		{
			// hide kendo editor color picker when scroll the modal box
			self.messageBodyEditor && self.messageBodyEditor.toolbar.refreshTools();
		});

		self.initEditor();
		self.initRolesAccessControl();
		self.updateFormRolesWithPublicChange();
	};

	EditUserDefinedSectionViewModel.prototype.initEditor = function()
	{
		if (!this.isUDFGroup)
		{
			return;
		}

		var self = this,
			$editorWrapper = $(".question-wrapper"),
			MessageBodyHtmlEditor = $("#QuestionBodyHtmlEditor");

		$editorWrapper.css("visibility", "visible");
		if (self.messageBodyEditor)
		{
			self.messageBodyEditor.destroy();
		}

		self.messageBodyEditor = $("#QuestionBodyEditor").kendoEditor({
			resizable: {
				toolbar: !TF.isPhoneDevice,
				content: false
			},
			tools: ["formatting", "cleanFormatting", "undo", "redo", "fontName", "fontSize", "foreColor", "backColor", "bold", "italic", "underline", "justifyLeft",
				"justifyCenter", "justifyRight", "insertUnorderedList", "insertOrderedList", "indent", "createLink", "unlink", "createTable",
				"addRowAbove", "addRowBelow", "addColumnLeft", "addColumnRight", "deleteRow", "deleteColumn"],
			change: function()
			{
				self.messageBodyEditorChanged = (self.messageBodyEditor.value() !== self.obName());
			}
		}).data("kendoEditor");
		setTimeout(function()
		{
			$(self.messageBodyEditor.body).blur(function()
			{
				self.obName(self.messageBodyEditor.value());
				self.$element.find("input[name=name]").change();
			});

			$(self.messageBodyEditor.body).on("mouseup mouseout touchmove keyup focus blur", function()
			{
				const $clearCssIcon = self.messageBodyEditor.toolbar.element.find("span.k-i-clear-css");
				const hasSelectedText = self.messageBodyEditor.selectedHtml().length > 0;
				if (!hasSelectedText)
				{
					$clearCssIcon.addClass("disabled");
				}
				else
				{
					$clearCssIcon.removeClass("disabled");
				}
			});

			if (self.isUDFGroup)
			{
				function moveCaretToEditorContentEnd(editor)
				{
					var range = editor.getRange();
					if (range.collapsed)
					{
						var textNode = editor.body.lastChild;
						if (textNode)
						{
							range.setStartAfter(textNode);
							range.collapse(true);
							editor.selectRange(range);
							if (textNode.scrollIntoView)
							{
								textNode.scrollIntoView(false);
							}
						}
					}
				}

				self.messageBodyEditor.focus();
				moveCaretToEditorContentEnd(self.messageBodyEditor);
			}
		}, 300);

		MessageBodyHtmlEditor.blur(function()
		{
			self.$element.find("input[name=name]").change();
		});

		$editorWrapper.find(".k-insertImage").closest(".k-tool").hide();
		var $head = $("#messageBody").closest("#edit-message-control").find("iframe").contents().find("head");
		$head.append($("<link/>",
			{ rel: "stylesheet", href: "Global/ThirdParty/bootstrap/css/bootstrap.min.css", type: "text/css" }
		));
		self.messageBodyEditor.value(self.obName());
		self.messageBodyEditor.refresh();

		$(".editor-options-wrap .design").addClass("selected");
		$(".editor-options-wrap .html").removeClass("selected");
	};

	EditUserDefinedSectionViewModel.prototype.checkRoleAccessSelectedCheckboxes = function()
	{
		var self = this;
		var elements = self.typeRoles.ul.find("li");

		elements.each(index =>
		{
			const $element = $(elements[index]);
			const element = $element[0];
			const input = $element.children("input");

			$element.css("background-color", "transparent");
			input.prop("checked", $element.hasClass("k-state-selected"));

			//always disable administrator
			if (index == 0 && element && element.innerText.trim() == "Administrator")
			{
				input.prop("disabled", true);
			}

		});
	}

	EditUserDefinedSectionViewModel.prototype.initRolesAccessControl = function()
	{
		var self = this;

		function isIgnoredRole(roleId)
		{
			return roleId == ADMIN_ROLE_KEY;
		}

		self.$typeRoles = self.$element.find("#sectionRoles");
		var typeRolesData = [ADMIN_ROLE_ITEM];
		function disableAdministratorButton()
		{
			self.$typeRoles.parent().find("ul>li.k-button").filter((_, e) => $(e).text() === 'Administrator').addClass("k-state-disabled");
		}
		function disablePublicButton()
		{
			self.$typeRoles.parent().find("ul>li.k-button").filter((_, e) => $(e).text() === 'Public').addClass("k-state-disabled");
		}
		self.$typeRoles.kendoMultiSelect({
			dataTextField: "text",
			dataValueField: "value",
			itemTemplate: '<input type="checkbox" style="margin-right: 5px"/> #= text #',
			downArrow: true,
			autoClose: false,
			dataSource: typeRolesData,
			value: [ADMIN_ROLE_KEY],
			select: function(e)
			{
				e.preventDefault();
				//to prevent list to auto scroll
				var offset = this.list.offset().top - this.ul.offset().top + 1;
				var dataItem = e.dataItem;
				if (isIgnoredRole(dataItem.value))
				{
					return;
				}
				if (dataItem.value >= 0)
				{
					var roles = self.typeRoles.value();
					roles.push(dataItem.value);
					self.typeRoles.value(roles);
				}
				this.list.find(".k-list-scroller").scrollTop(offset);
				self.dataEntity.HasRole = self.typeRoles.value();
				disableAdministratorButton();
				self.checkRoleAccessSelectedCheckboxes();
			},
			deselect: function(e)
			{
				e.preventDefault();
				//to prevent list to auto scroll
				var offset = this.list.offset().top - this.ul.offset().top + 1;
				var dataItem = e.dataItem;
				if (isIgnoredRole(dataItem.value))
				{
					return;
				}
				var roles = self.typeRoles.value();
				roles = roles.filter(x => x !== dataItem.value);
				self.typeRoles.value(roles);
				this.list.find(".k-list-scroller").scrollTop(offset);
				self.dataEntity.HasRole = self.typeRoles.value();
				disableAdministratorButton();
				self.checkRoleAccessSelectedCheckboxes();
			},
			close: function()
			{
				self.typeRoles.isOpen = false;
			},
			dataBound: function()
			{
				//RW-35992 Checkbox Status incorrect after filter and dataBound
				self.typeRoles && self.checkRoleAccessSelectedCheckboxes();
			}
		});
		self.typeRoles = self.$typeRoles.data("kendoMultiSelect");
		self.typeRoles.disableAdministratorButton = disableAdministratorButton;
		self.typeRoles.disablePublicButton = disablePublicButton;
		return self.setRolesDataSource(self.typeRoles, typeRolesData, self.gridType);
	}

	EditUserDefinedSectionViewModel.prototype.updateFormRolesWithPublicChange = function()
	{
		const self = this;
		if (!self.typeRoles) return;
		self.updateFormRolesWithAssignRoleChange();
	}

	EditUserDefinedSectionViewModel.prototype.updateFormRolesWithAssignRoleChange = function()
	{
		const self = this;
		if (!self.canAssignRole())
		{
			self.typeRoles.enable(false);
			self.typeRoles.value(!self.dataEntity.IsPublic ? DEFAULT_PRIVATE_ROLES_KEYS : DEFAULT_PUBLIC_ROLES_KEYS);
			self.typeRoles.disableAdministratorButton();
			self.typeRoles.disablePublicButton();
		}
	}

	EditUserDefinedSectionViewModel.prototype.setRolesDataSource = function(typeRolesControl, typeRolesData, gridType)
	{
		function IsValidRoleId(roleId)
		{
			return roleId > 0 || (self.isPublicForm && roleId == PUBLIC_ROLE_KEY);
		}

		var self = this;
		var rolesData = self.dataEntity.AllRole ? self.dataEntity.AllRole.data : [];
		var sectionRolesData = [];
		for (const roleIndex in rolesData)
		{
			if (IsValidRoleId(rolesData[roleIndex].value) &&
				self.dataEntity.HasRole.indexOf(rolesData[roleIndex].value) > -1)
			{
				sectionRolesData.push(rolesData[roleIndex]);
			}
		}
		for (const role of sectionRolesData)
		{
			typeRolesData.push({ text: role.text, value: role.value });
		}
		const rolesDataSource = new kendo.data.DataSource({
			data: typeRolesData
		});
		typeRolesControl.setDataSource(rolesDataSource);

		//empty means all roles
		const selectedValues = (self.dataEntity.RoleSections && self.dataEntity.RoleSections.length > 0)
			? self.dataEntity.RoleSections.map(x => x.RoleID)
			: DEFAULT_PRIVATE_ROLES_KEYS.concat(self.dataEntity.HasRole);

		self.typeRoles.value(selectedValues);

		const $dropdownIcon = $(`<span class="dropdown-icon"><span class="k-icon k-i-arrow-60-down"></span></span>`);
		$dropdownIcon.off("click.MultiSelectDropdownControl").on("click.MultiSelectDropdownControl", () =>
		{
			if (!self.typeRoles)
			{
				return;
			}
			if (self.typeRoles.isOpen)
			{
				self.typeRoles.close();
				self.typeRoles.isOpen = false;
			} else
			{
				self.typeRoles.open();
				self.typeRoles.isOpen = true;
			}
		});
		self.typeRoles.wrapper.find("div.k-multiselect-wrap").append($dropdownIcon);

		self.typeRoles.wrapper.off("click.openDropdown").on("click.openDropdown", function(e)
		{
			self.typeRoles && self.typeRoles.open();
		});

		self.dataEntity.HasRole = self.typeRoles.value();
		self.checkRoleAccessSelectedCheckboxes();
		self.typeRoles.disableAdministratorButton();
	}


	EditUserDefinedSectionViewModel.prototype.changePattern = function(viewModel, e)
	{
		var self = this,
			$MessageBodyHtmlEditor = $("#QuestionBodyHtmlEditor"),
			$optionBtn = $(e.target).closest(".option");

		if ($optionBtn.hasClass("selected"))
		{
			return;
		}

		var $container = $optionBtn.closest(".question-wrapper");
		$container.find(".option").removeClass("selected");
		$optionBtn.addClass("selected");

		if ($optionBtn.hasClass("design"))
		{
			$container.find(".text-editor-wrapper").show();
			$container.find(".html-editor-wrapper").hide();
			self.messageBodyEditor.value($MessageBodyHtmlEditor.val());
		}
		else
		{
			$container.find(".html-editor-wrapper").show();
			$container.find(".text-editor-wrapper").hide();
			$MessageBodyHtmlEditor.val(self.messageBodyEditor.value());
		}
	};

	EditUserDefinedSectionViewModel.prototype._updateValidation = function()
	{
		var self = this,
			validatorFields = {};

		validatorFields.name = {
			container: self.$element.find("input[name='name']").closest("div"),
			validators:
			{
				notEmpty: {
					message: 'Name is required'
				},
				callback:
				{
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						value = value.trim().replace(/(?:^(?:&nbsp;)+)|(?:(?:&nbsp;)+$)/g, '');
						if (value === "")
						{
							return true;
						}
						if (self.dataEntity && self.dataEntity.ExistedNames)
						{
							if (self.dataEntity.ExistedNames.some(x => x.toLowerCase() === value.toLowerCase()))
							{
								return false;
							}
						}
						return true;
					}
				}
			}
		};

		if (self.isUDFGroup)
		{
			validatorFields.name.validators.notAllBlankHtml = {
				message: `Name should not contain only blank characters`
			}

			validatorFields.name.validators.noUnsafeHtmlTagsAndHtmlEscapes = {
				message: `Please remove special character(s) from Section Name above`
			}

			self.$element.bootstrapValidator(
				{
					excluded: [':hidden', ':not(:visible)'],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				});
		}
	};


	EditUserDefinedSectionViewModel.prototype.apply = function()
	{
		var self = this;
		var validator = this.$element.data("bootstrapValidator");
		if (!validator)
		{
			self._updateValidation();
			validator = this.$element.data("bootstrapValidator");
		}

		if (validator)
		{
			return validator.validate().then(function(valid)
			{
				if (!valid)
				{
					return false;
				}

				return self.edit();
			}.bind(self));
		}
		else
		{
			self._clearPublicRoleSection(self.dataEntity);
			return Promise.resolve(false);
		}
	};

	EditUserDefinedSectionViewModel.prototype.cancel = function()
	{
		var self = this;
		$("body").find(".symbols-panel.pin-icon-selector").hide();
		if (self.typeRoles.isOpen)
		{
			self.typeRoles.close();
		}

		self._clearPublicRoleSection(self.dataEntity);
		return Promise.resolve(false);
	};

	EditUserDefinedSectionViewModel.prototype.edit = function()
	{
		var self = this;

		self.dataEntity.IsPublic = self._calcSectionIsPublic(self.dataEntity, self.isPublicForm);
		self._clearPublicRoleSection(self.dataEntity);

		return {
			Name: self.trimName(self.obName()),
			HasRole: self.filterRole(self.dataEntity.HasRole),
			IsPublic: self.dataEntity.IsPublic
		}
	};

	EditUserDefinedSectionViewModel.prototype._calcSectionIsPublic = function(section, isPublicForm)
	{
		let isPublicSection = false;
		if (!isPublicForm)
		{
			return isPublicSection;
		}

		let roleSections = section.HasRole || [];
		const isAssignedAllRoles = (roleSections == [] || !roleSections.length);
		isPublicSection = isAssignedAllRoles || !!(roleSections.indexOf(PUBLIC_ROLE_KEY) >= 0);

		return isPublicSection
	}

	EditUserDefinedSectionViewModel.prototype._clearPublicRoleSection = function(section)
	{
		section.RoleSections = section.RoleSections.filter(r => r.RoleID != PUBLIC_ROLE_KEY);
		section.HasRole = section.HasRole.filter(r => r != PUBLIC_ROLE_KEY);
	}

	EditUserDefinedSectionViewModel.prototype.trimName = (name) => name.trim().replace(/(?:^(?:&nbsp;)+)|(?:(?:&nbsp;)+$)/g, '').replace('&nbsp;', ' ')

	EditUserDefinedSectionViewModel.prototype.filterRole = function(role)
	{
		var self = this;
		var exceptAll = self.typeRoles.ul.find("li").not(":lt(1)");

		if (exceptAll.length === (role.length - 1))
		{
			// empty means all roles
			return [];
		}
		else
		{
			// -1 means no role
			return role;
		}
	}

	EditUserDefinedSectionViewModel.prototype.dispose = function()
	{
		if (this.messageBodyEditor)
		{
			this.messageBodyEditor.destroy();
			this.messageBodyEditor = null;
		}
	};
})();
