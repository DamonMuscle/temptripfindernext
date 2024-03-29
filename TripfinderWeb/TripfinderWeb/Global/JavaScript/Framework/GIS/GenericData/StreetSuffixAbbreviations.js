//USPS Street Suffix Abbreviations https://pe.usps.com/text/pub28/28apc_002.htm
//Abbreviation Dictionary  https://support.esri.com/en/technical-article/000008454
const streetSuffixAbbreviations =
{
	"aly": ["allee", "alley", "ally", "aly."],
	"anx": ["anex", "annex", "annx", "anx."],
	"arc": ["arcade", "arc."],
	"ave": ["aven", "av", "avenue", "avenu", "avnue", "ave."],
	"byu": ["bayoo", "bayou", "byu."],
	"bch": ["beach", "bch", "bch."],
	"bnd": ["bend", "bnd", "bnd."],
	"blf": ["bluff", "bluf", "blf."],
	"blfs": ["bluffs", "blfs."],
	"btm": ["bottom", "bot", "bottm", "btm."],
	"blvd": ["boul", "boulevard", "boulv", "blvd."],
	"br": ["branch", "brnch", "br."],
	"brg": ["bridge", "brdge", "brg."],
	"brk": ["brook", "brk."],
	"brks": ["brooks", "brks."],
	"bg": ["burg", "bg."],
	"bgs": ["burgs", "bgs."],
	"byp": ["bypa", "bypas", "bypass", "byps", "byp."],
	"cp": ["camp", "cp."],
	"cyn": ["canyon", "canyn", "cnyn", "cyn."],
	"cpe": ["cape", "cpe."],
	"cswy": ["causeway", "causwa", "cswy."],
	"ctr": ["cen", "cent", "center", "centr", "centre", "cnter", "cntr", "ctr."],
	"ctrs": ["centers", "ctrs."],
	"cir": ["circ", "circl", "circle", "crcl", "crcle", "cir."],
	"cirs": ["circles", "cirs."],
	"clfs": ["cliffs", "clfs."],
	"clb": ["club", "clb."],
	"cmn": ["common", "cmn."],
	"cmns": ["commons", "cmns."],
	"cor": ["corner", "cor."],
	"cors": ["corners", "cors."],
	"crse": ["course", "crse."],
	"ct": ["court", "ct."],
	"cts": ["courts", "cts."],
	"cv": ["cove", "cv."],
	"cvs": ["coves", "cvs."],
	"crk": ["creek", "crk."],
	"cres": ["crescent", "crsent", "crsnt", "cres."],
	"crst": ["crest", "crst."],
	"xing": ["crossing", "crssng", "xing."],
	"xrd": ["crossroad", "xrd."],
	"xrds": ["crossroads", "xrds."],
	"curv": ["curve", "curv."],
	"dl": ["dale", "dl."],
	"dm": ["dam", "dm."],
	"dv": ["div", "divide", "dvd", "dv."],
	"dr": ["driv", "drive", "drv", "dr."],
	"drs": ["drives", "drs."],
	"est": ["estate", "est."],
	"ests": ["estates", "ests."],
	"expy": ["exp", "expr", "express", "expressway", "expw", "expy."],
	"ext": ["extension", "extn", "extnsn", "ext."],
	"exts": ["extensions", "exts."],
	"fls": ["falls", "fls."],
	"fry": ["ferry", "frry", "fry."],
	"fld": ["field", "fld."],
	"flds": ["fields", "flds."],
	"flt": ["flat", "flt."],
	"flts": ["flats", "flts."],
	"frd": ["ford", "frd."],
	"frds": ["fords", "frds."],
	"frst": ["forest", "forests", "frst."],
	"frg": ["forge", "forg", "frg."],
	"frgs": ["forges", "frgs."],
	"frk": ["fork", "frk."],
	"frks": ["forks", "frks."],
	"ft": ["fort", "frt", "ft."],
	"fwy": ["freeway", "freewy", "frway", "frwy", "fwy."],
	"gdn": ["garden", "gardn", "grden", "grdn", "gdn."],
	"gdns": ["gardens", "grdns", "gdns."],
	"gtwy": ["gateway", "gatewy", "gatway", "gtway", "gtwy."],
	"gln": ["glen", "gln."],
	"glns": ["glens", "glns."],
	"grn": ["green", "grn."],
	"grns": ["greens", "grns."],
	"grv": ["grove", "grov", "grv."],
	"grvs": ["groves", "grvs."],
	"hbr": ["harbor", "harb", "harbr", "hrbor", "hbr."],
	"hbrs": ["harbors", "hbrs."],
	"hvn": ["haven", "hvn."],
	"hts": ["heights", "ht", "hts."],
	"hwy": ["highway", "highwy", "hiway", "hiwy", "hway", "hwy."],
	"hl": ["hill", "hl."],
	"hls": ["hills", "hls."],
	"holw": ["hollow", "hllw", "hollows", "holws", "holw."],
	"inlt": ["inlet", "inlt."],
	"is": ["island", "islnd", "is."],
	"iss": ["islands", "iss."],
	"isle": ["isles", "isle."],
	"jct": ["junction", "jction", "jctn", "junctn", "juncton", "jct."],
	"jcts": ["junctions", "jctns", "jcts."],
	"ky": ["key", "ky."],
	"kys": ["keys", "kys."],
	"knl": ["knoll", "knol", "knl."],
	"knls": ["knolls", "knls."],
	"lk": ["lake", "lk."],
	"lks": ["lakes", "lks."],
	"lndg": ["landing", "lndng", "lndg."],
	"ln": ["lane", "ln."],
	"lgt": ["light", "lgt."],
	"lgts": ["lights", "lgts."],
	"lf": ["loaf", "lf."],
	"lck": ["lock", "lck."],
	"lcks": ["locks", "lcks."],
	"ldg": ["lodge", "ldge", "lodg", "ldg."],
	"mnr": ["manor", "mnr."],
	"mnrs": ["manors", "mnrs."],
	"mdw": ["meadow", "mdw."],
	"mdws": ["meadows", "medows", "mdws."],
	"mews": ["mews."],
	"ml": ["mill", "ml."],
	"mls": ["mills", "mls."],
	"msn": ["mission", "missn", "mssn", "msn."],
	"mtwy": ["motorway", "mtwy."],
	"mt": ["mount", "mnt", "mt."],
	"mtn": ["mountain", "mntain", "mntn", "mountin", "mtin", "mtn."],
	"mtns": ["mountains", "mntns", "mtns."],
	"nck": ["neck", "nck."],
	"orch": ["orchard", "orchrd", "orch."],
	"oval": ["ovl", "oval."],
	"opas": ["overpass", "opas."],
	"park": ["prk", "parks", "park."],
	"pkwy": ["parkway", "parkways", "parkwy", "pkway", "pkwys", "pkwy."],
	"psge": ["passage", "psge."],
	"path": ["paths", "path."],
	"pike": ["pikes", "pike."],
	"pne": ["pine", "pne."],
	"pnes": ["pines", "pnes."],
	"pl": ["place", "pl."],
	"pln": ["plain", "pln."],
	"plns": ["plains", "plns."],
	"plz": ["plaza", "plza", "plz."],
	"pt": ["point", "pt."],
	"pts": ["points", "pts."],
	"prt": ["port", "prt."],
	"prts": ["ports", "prts."],
	"pr": ["prairie", "prr", "pr."],
	"radl": ["radial", "radiel", "rad", "radl."],
	"rnch": ["ranch", "ranches", "rnchs", "rnch."],
	"rpd": ["rapid", "rpd."],
	"rpds": ["rapids", "rpds."],
	"rst": ["rest", "rst."],
	"rdg": ["ridge", "rdge", "rdg."],
	"rdgs": ["ridges", "rdgs."],
	"riv": ["river", "rivr", "rvr", "riv."],
	"rd": ["road", "rd."],
	"rds": ["roads", "rds."],
	"rte": ["route", "rte."],
	"row": ["row."],
	"rue": ["rue."],
	"run": ["run."],
	"shl": ["shoal", "shl."],
	"shls": ["shoals", "shls."],
	"shr": ["shore", "shr."],
	"shrs": ["shores", "shrs."],
	"skwy": ["skyway", "skwy."],
	"spg": ["spring", "sprng", "spng", "spg."],
	"spgs": ["springs", "sprngs", "spngs", "spgs."],
	"spur": ["spurs", "spur."],
	"sq": ["square", "sqr", "sqre", "squ", "sq."],
	"sqs": ["squares", "sqrs", "sqs."],
	"stra": ["straven", "stravn", "strvn", "starv", "stravenue", "stra."],
	"strm": ["stream", "streme", "strm."],
	"st": ["street", "strt", "str", "st."],
	"sts": ["streets", "strts", "sts."],
	"smt": ["summit", "sumit", "sumitt", "smt."],
	"ter": ["terrace", "terr", "ter."],
	"trwy": ["throughway", "trwy."],
	"trce": ["trace", "traces", "trce."],
	"trak": ["track", "tracks", "trk", "trks", "trak."],
	"trfy": ["trafficway", "trfy."],
	"trl": ["trail", "trails", "trls", "trl."],
	"trlr": ["trailer", "trlrs", "trlr."],
	"tunl": ["tunnel", "tunnels", "tunel", "tunls", "tunl."],
	"tpke": ["turnpike", "turnpk", "trnpk", "tpke."],
	"un": ["union", "un."],
	"vly": ["valley", "vally", "vlly", "vly."],
	"vlys": ["valleys", "vlys."],
	"via": ["vdct", "viadct", "viaduct", "via."],
	"vw": ["view", "vw."],
	"vws": ["views", "vws."],
	"vlg": ["village", "villag", "vill", "villg", "villiage", "vlg."],
	"vlgs": ["villages", "vlgs."],
	"vl": ["ville", "vl."],
	"vis": ["vista", "vist", "vsta", "vst", "vis."],
	"wl": ["well", "wl."],
	"wls": ["wells", "wls."],
}
