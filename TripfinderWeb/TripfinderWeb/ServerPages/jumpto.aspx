<%@ Page Language="C#" %>
<script runat="server">
    protected void Page_Load(object sender, EventArgs e)
	{
		string tripId = Request.QueryString["editft"];
		string dbId = Request.QueryString["DB"];

		string urlPath = this.ResolveUrl(string.Format("~/?tripid={0}&DB={1}", tripId, dbId));
		Response.RedirectPermanent(urlPath);
	}
</script>