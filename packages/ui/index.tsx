import logo from './assets/imgIcon.svg';
import panelLogo from './assets/panel-imgIcon.svg';
import edit from './assets/imgIconEdit.svg';
import send from './assets/imgIconSend.svg';
import external from './assets/imgIconExternal.svg';
import assistant from './assets/imgFitsAssistant.svg';
import check from './assets/imgIconCheck.svg';
import panelClose from './assets/panel-imgIcon1.svg';
import panelEdit from './assets/panel-imgIcon2.svg';
import info from './assets/panel-imgIcon3.svg';
import panelCheck from './assets/panel-imgIcon4.svg';
import chevron from './assets/panel-imgIcon5.svg';
import panelExternal from './assets/panel-imgIcon6.svg';
export const assets={logo,panelLogo,edit,send,external,assistant,check,panelClose,panelEdit,info,panelCheck,chevron,panelExternal};
export function Brand({panel=false}:{panel?:boolean}) {return <span className={`brand ${panel?'brand-panel':''}`}><img src={panel?panelLogo:logo} alt=""/>fits</span>;}
