// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports"],function(g){let h=function(){function e(){this.m_version=10;this.m_real_exercise_sim=0;this.m_affiliation=1;this.m_symbol_set=10;this.m_echelon_mobility=this.m_HQ_TF_FD=this.m_status=0}var d=e.prototype;d.fromFullCode=function(a){this.m_version=parseInt(a.substring(0,2),10);this.m_real_exercise_sim=parseInt(a.substring(2,3),10);this.m_affiliation=parseInt(a.substring(3,4),10);this.m_symbol_set=parseInt(a.substring(4,6),10);this.m_status=parseInt(a.substring(6,7),10);this.m_HQ_TF_FD=
parseInt(a.substring(7,8),10);this.m_echelon_mobility=parseInt(a.substring(8,10),10);this.m_entity_code=a.substring(10,16);this.m_modifier1=a.substring(16,18);this.m_modifier2=a.substring(18,20)};d.setRandom=function(){let a;a="10"+Math.floor(2.999*Math.random());a+=Math.floor(1+5.999*Math.random());a=a+10+Math.floor(6.999*Math.random());a+=Math.floor(7.999*Math.random());var b=[0,10,11,12,13,14,15,16,17,18,21,22,23,24,25,26,31,32,33,34,35,36,37,41,42,51,52,61,62];b=b[Math.floor(Math.random()*(b.length-
.001))];10>b&&(a+="0");let c;c="110000 110100 110200 110300 110400 110500 110600 110601 110700 110800 110900 111100 111200 120200 120500 120600 120700 120800 120900 121000 121200 121400 121500 121600 121700 121800 121801 121803 121804 121805 121900 130300 130301 130400 130500 130600 130700 130800 130801 130802 130803 130900 140100 140101 140200 140300 140400 140500 140600 140700 140701 140800 140900 141000 141100 141200 141300 141400 141500 141600 141700 141701 141800 141900 142000 142100 150100 150200 150300 150400 150500 150501 150502 150503 150505 150600 150700 150900 151000 151100 151200 160000 160100 160300 160400 160500 160600 160700 160800 160900 161000 161100 161500 161600 162300 162400 162500 162600 162700 162800 162900 163000 163100 163200 163300 163500 163600 164700 164800 164900 170100 180100 180200 180300 180400 190000 200000 200100 200200 200300 200400 200500 200600 200700 200800 200900 201000 201100 201200 201300".split(" ");
a=a+b+c[Math.floor(Math.random()*(c.length-.001))];a+="00";a+="00";this.fromFullCode(a)};d.is_valid=function(){switch(this.m_symbol_set){case 0:case 99:return!1;default:return!0}};d.is_land_unit_special_entity_subtype=function(){return 0<this.special_entity_subtype().length};d.special_entity_subtype=function(){let a="";if(10!==this.m_symbol_set||6!==this.m_entity_code.length)return a;const b=this.m_entity_code.substring(4,6);if("95"===b||"96"===b||"97"===b||"98"===b)a=b;return a};d.is_control_measure=
function(){return 25===this.m_symbol_set};d.is_weather=function(){return 46===this.m_symbol_set||45===this.m_symbol_set};d.has_frame=function(){switch(this.m_symbol_set){case 25:case 45:case 46:case 47:case 98:return!1;case 30:return"150000"===this.m_entity_code?!1:!0;default:return!0}};d.has_amplifiers=function(){switch(this.m_symbol_set){case 25:case 45:case 46:case 47:return!1;default:return!0}};return e}(),k=function(){function e(){this.ms_symbol_set_to_frame_map={};this.ms_affiliation_to_frame_map=
{};this.ms_affiliation_to_suffix_name_alt={};this.ms_symbol_set_to_frame_map[0]=0;this.ms_symbol_set_to_frame_map[99]=0;this.ms_symbol_set_to_frame_map[1]=1;this.ms_symbol_set_to_frame_map[2]=1;this.ms_symbol_set_to_frame_map[5]=5;this.ms_symbol_set_to_frame_map[6]=5;this.ms_symbol_set_to_frame_map[10]=10;this.ms_symbol_set_to_frame_map[11]=10;this.ms_symbol_set_to_frame_map[15]=30;this.ms_symbol_set_to_frame_map[20]=20;this.ms_symbol_set_to_frame_map[25]=0;this.ms_symbol_set_to_frame_map[60]=30;
this.ms_symbol_set_to_frame_map[45]=0;this.ms_symbol_set_to_frame_map[46]=0;this.ms_symbol_set_to_frame_map[47]=0;this.ms_symbol_set_to_frame_map[30]=30;this.ms_symbol_set_to_frame_map[35]=35;this.ms_symbol_set_to_frame_map[36]=35;this.ms_symbol_set_to_frame_map[40]=40;this.ms_symbol_set_to_frame_map[50]=5;this.ms_symbol_set_to_frame_map[51]=1;this.ms_symbol_set_to_frame_map[52]=30;this.ms_symbol_set_to_frame_map[53]=30;this.ms_symbol_set_to_frame_map[54]=35;this.ms_symbol_set_to_frame_map[98]=0;
this.ms_affiliation_to_frame_map[0]=1;this.ms_affiliation_to_frame_map[1]=1;this.ms_affiliation_to_frame_map[2]=3;this.ms_affiliation_to_frame_map[3]=3;this.ms_affiliation_to_frame_map[4]=4;this.ms_affiliation_to_frame_map[5]=6;this.ms_affiliation_to_frame_map[6]=6;this.ms_affiliation_to_frame_map[8]=1;this.ms_affiliation_to_suffix_name_alt[0]="_1";this.ms_affiliation_to_suffix_name_alt[1]="_1";this.ms_affiliation_to_suffix_name_alt[2]="_3";this.ms_affiliation_to_suffix_name_alt[3]="_3";this.ms_affiliation_to_suffix_name_alt[4]=
"_4";this.ms_affiliation_to_suffix_name_alt[5]="_6";this.ms_affiliation_to_suffix_name_alt[6]="_6";this.ms_affiliation_to_suffix_name_alt[7]="_1";this.ms_affiliation_to_suffix_name_alt[8]="_1"}var d=e.prototype;d.symbol_set_to_frame=function(a){a=this.ms_symbol_set_to_frame_map[a];void 0===a&&(a=0);return a};d.affiliation_to_frame=function(a){a=this.ms_affiliation_to_frame_map[a];void 0===a&&(a=1);return a};d.affiliation_to_suffix_name_alt=function(a){return this.ms_affiliation_to_suffix_name_alt[a]};
d.str_identity=function(a){return a.toString()};d.str_affiliation=function(a){return a.toString()};d.str_symbol_set=function(a){let b="";10>a&&(b+="0");return b+a};d.str_status=function(a){return a.toString()};d.str_hq_tf_fd=function(a){return a.toString()};d.str_echelon_mobility=function(a){let b="";10>a&&(b+="0");return b+a};d.get_frame_icon_=function(a){if(7===a.m_affiliation)return"";let b="";switch(a.m_real_exercise_sim){case 0:b+="0";break;case 1:b+="1";break;case 2:b+="2";break;default:b+=
"0"}b=b+"_"+this.str_affiliation(a.m_affiliation);const c=this.symbol_set_to_frame(a.m_symbol_set);b+=this.str_symbol_set(c);if(1===a.m_status)switch(a.m_affiliation){case 3:case 6:case 4:case 1:b+="_1";break;default:b+="_0"}else b+="_0";return b};d.get_main_icon_=function(a){let b=this.str_symbol_set(a.m_symbol_set);a.is_land_unit_special_entity_subtype()&&4<a.m_entity_code.length?(b+=a.m_entity_code.substring(0,4),b+="00"):b+=a.m_entity_code;a.is_control_measure()?(a=this.affiliation_to_suffix_name_alt(a.m_affiliation),
b+=a):a.is_weather()&&(b+="_C");return b};d.get_modifier1_icon_=function(a){if(!a.m_modifier1||0===a.m_modifier1.length)return"";let b=this.str_symbol_set(a.m_symbol_set);b+=a.m_modifier1;return b+"1"};d.get_modifier2_icon_=function(a){if(!a.m_modifier2||0===a.m_modifier2.length)return"";let b=this.str_symbol_set(a.m_symbol_set);b+=a.m_modifier2;return b+"1"};d.get_echelon_mobility_icon_=function(a){if(0===a.m_echelon_mobility)return"";let b="";const c=this.affiliation_to_frame(a.m_affiliation);b+=
this.str_affiliation(c);return b+=this.str_echelon_mobility(a.m_echelon_mobility)};d.get_hq_tf_fd_icon_=function(a){if(0===a.m_HQ_TF_FD)return"";let b="";var c=this.affiliation_to_frame(a.m_affiliation);b+=this.str_affiliation(c);c=this.symbol_set_to_frame(a.m_symbol_set);switch(c){case 40:case 99:case 0:c=10}b+=this.str_symbol_set(c);return b+=this.str_hq_tf_fd(a.m_HQ_TF_FD)};d.get_op_condition_icon_=function(a){switch(a.m_status){case 1:case 0:case 6:return""}let b;b="0";var c=this.affiliation_to_frame(a.m_affiliation);
b+=this.str_affiliation(c);c=this.symbol_set_to_frame(a.m_symbol_set);b+=this.str_symbol_set(c);b+=this.str_status(a.m_status);return b+"2"};d.get_symbol_keys=function(a){const b=[];if(!a.is_valid())return b;var c=a.has_frame();if(c){var f=this.get_frame_icon_(a);0<f.length&&b.push(f)}f=this.get_main_icon_(a);0<f.length&&b.push(f);c&&(c=this.get_modifier1_icon_(a),0<c.length&&b.push(c),c=this.get_modifier2_icon_(a),0<c.length&&b.push(c),a.has_amplifiers()&&(c=this.get_echelon_mobility_icon_(a),0<
c.length&&b.push(c),c=this.get_hq_tf_fd_icon_(a),0<c.length&&b.push(c),a=this.get_op_condition_icon_(a),0<a.length&&b.push(a)));return b};return e}();g.Mil2525dCode=h;g.Mil2525dEngine=k;Object.defineProperty(g,"__esModule",{value:!0})});