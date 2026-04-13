let sum: number = 0;

for (let i: number = 2; i < process.argv.length; i++) {
  sum = sum + Number(process.argv[i]);
}

console.log(sum);
