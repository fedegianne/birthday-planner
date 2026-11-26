export const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const parseDay=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
export const diff=(a,b)=>Math.round((Date.UTC(a.getFullYear(),a.getMonth(),a.getDate())-Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()))/86400000);
// February 29 birthdays are observed on February 28 in non-leap years.
export const birthday=(p,y)=>new Date(y,p.month-1,Math.min(p.day,new Date(y,p.month,0).getDate()));
export function nextBirthday(p,now=new Date()){let d=birthday(p,now.getFullYear());if(diff(d,now)<0)d=birthday(p,now.getFullYear()+1);return d}
export const countdown=n=>n===0?'Today':n===1?'Tomorrow':n<0?`${-n} days ago`:`${n} days left`;
