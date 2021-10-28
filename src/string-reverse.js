export default function reverse(str) {
  if (str === "") return str;
  const [c, ...cs] = str.split("");
  return reverse(cs.join("")) + c;
}
