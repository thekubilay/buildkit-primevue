const spanStyleMap: {
  [key: string]: string;
} = {
  "1": "100%",
  "2": "calc(50% - 6px)",    // 50% - (gap/2)
  "3": "calc(33.33% - 8px)",  // 33.33% - (gap*2/3)
  "4": "calc(25% - 9px)",     // 25% - (gap*3/4)
  "5": "calc(20% - 9.6px)",   // 20% - (gap*4/5)
  "6": "calc(16.67% - 10px)", // 16.67% - (gap*5/6)

}

export default spanStyleMap