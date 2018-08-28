(function()
{
	createNamespace("TF").TokenStorageManager = TokenStorageManager;

	function TokenStorageManager()
	{
		this.prefix = "ent.";
		this.storageManager = new TF.StorageManager("ent");
	};

	//TokenStorageManager.prototype.save = function(token)
	//{
	//	var self = this;
	//	self.storageManager.save("token", token, true);
	//};

	//TokenStorageManager.prototype.get = function()
	//{
	//	var self = this;
	//	return self.storageManager.get("token", true);
	//};

	TokenStorageManager.prototype.save = function(key, value)
	{
		var self = this;
		self.storageManager.save(key, value, true);
	};

	TokenStorageManager.prototype.get = function(key)
	{
		var self = this;
		return self.storageManager.get(key, true);
	};

})();
