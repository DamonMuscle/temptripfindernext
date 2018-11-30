(function()
{
	createNamespace("TF").EntStorageManager = EntStorageManager;

	function EntStorageManager()
	{
		this.prefix = "ent.";
		this.storageManager = new TF.StorageManager("ent");
	};

	EntStorageManager.prototype.save = function(key, value)
	{
		this.storageManager.save(key, value, true);
	};

	EntStorageManager.prototype.get = function(key)
	{
		return this.storageManager.get(key, true);
	};

})();
