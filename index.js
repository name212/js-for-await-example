function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// запускаем beforeFun если есть
// создаем таймер и оборочиваем его в промиз
// авейтимся, создавая задержку
// и после задержи исполняем actionFun
async function runWithTimeout(minTms, maxTms, actionFun, param, beforeFun) {
  const timeoutMs = getRandomArbitrary(minTms, maxTms)

  if (beforeFun) {
    beforeFun(timeoutMs, param)
  }

  const waitPromise = new Promise((resolve, reject) => {
    setTimeout(resolve, timeoutMs);
  });

  await waitPromise

  actionFun(param, timeoutMs)
}

// просто таймаут без всяких действий
async function timeout(ms) {
  return runWithTimeout(ms, ms, () => void 0)
}

async function printBefore(timeoutMs, index) {
  console.log(`Print ${index} after waiting ${timeoutMs} ms`)
}

async function printIndex(index) {
  console.log(index)
}

// вывод в консоль
// таймаута и индекса которого мы должны вывести
// ждем по таймауту
// и просто выводим циферку
async function printIndexWithTimeout(index, maxTimeoutMs) {
  const max = maxTimeoutMs || 4000
  return runWithTimeout(1000, max, printIndex, index, printBefore)
}

// функция возвращающая индекс после таймаута
async function returnIndexWithTimeout(index, maxTimeoutMs, minTimeoutMs) {
  const min = minTimeoutMs || 1500
  const max = maxTimeoutMs || 4000
  const timeoutMs = getRandomArbitrary(min, max)
  console.log(`Timeout ${timeoutMs} before return ${index}`)
  await timeout(timeoutMs)
  return index
}

// асинхронный генератор
// генерит числа со start в количестве count
async function* generateIndex(start, count) {
  const timeoutMs = 5000
  for (let i = 0; i < count; i++) {
    const index = start + i
    console.log(`Timeout ${timeoutMs} before generate ${index}`)
    await timeout(timeoutMs)
    yield index
  }

}


function printInFrame(msg) {
  console.log('****************')
  console.log(msg)
  console.log('****************')
}

// основной замес начинается здесь
(async () => {
  printInFrame('Start test')

  // итак, самое главное опасение, как мне кажется, что
  // цикл пройдет все 10 итерации не остановившись
  // но это не так. Если бы js не стопарился при await в цикле
  // то async/await никто бы не пользовался 
  // до ES 2018 им бы просто невозможно было бы пользоваться

  for (let i = 0; i <= 10; i++) {
    await printIndexWithTimeout(i)
  }
  // можете попытать удачу, но вы всегда получите последовательный вывод из
  // 10 цифр и после них следующее сообщение
  printInFrame('Finish print [0, 10] numbers with timeouts in simple for-loop')

  // тоже самое работает и для for..of
  const indexesForValid = [11, 12, 13, 14]
  for (const indx of indexesForValid) {
    await printIndexWithTimeout(indx)
  }

  printInFrame('Finish print [11, 14] numbers with timeouts in for-of-loop')

  // единственное, когда это действительно не будет работать,
  // так это метод forEach (map тоже)
  // тут действительно forEach пройдется по массиву
  // насоздаст промизов, а завершатся они будут в произвольном порядке
  const indexesForInvalid = [15, 16, 17]
  const forEachTimeout = 1500
  indexesForInvalid.forEach(async (i) => {
    await printIndexWithTimeout(i, forEachTimeout)
  })

  printInFrame('Finish print [15, 17] numbers with timeouts in forEach method')
  // тут мы можем получить как
  // 15 16 17
  // как и 
  // 17 16 15
  // как и
  // 16 17 15
  // на все воля движка


  // +2 чтобы точно дождаться вывода от предыдущего forEach'a
  // ибо никто не гарантирует, что промиз с setTimeout точно проснется 
  // через необходимое время. меньше никогда, больше - запросто
  const waitUglyOutMs = forEachTimeout * (indexesForInvalid.length + 2)
  await timeout(waitUglyOutMs)
  printInFrame(`Finish wait ${waitUglyOutMs}ms after ugly forEach output`)

  // после всех манипуляций выше возникает резонный вопрос:
  // а накой хрен нужен еще и for-await цикл?
  // так вот js 2015 ввел протокол итераторов. 
  // так называемые перебираемы объекты https://learn.javascript.ru/iterable
  // такие объекты можно использовать в цикле for..of
  // плюс появились генераторы, они реализуют протокол итераторов
  // можно в принципе считать их синтаксическим сахаром к итераторам
  // но обычные итераторы синхронны, а в множестве случаем нам было бы удобнее
  // сделать асинхронный итератор, например, такой итератор, который
  // будет возвращать построчно файл.
  // но использовать его в простом for..of нельзя. Пример
  // Следующий кусок кода вернет 
  // TypeError: generateIndex(...) is not iterable
  // так как генератор вернул промиз, а промиз неитерируемый объект
  //
  // for(const indx of generateIndex(32, 4)){
  //  console.log('for-of async generator generated index:', indx)
  // }
  // printInFrame('Finish print [28, 31] numbers with async generator with for-await-of loop')
  //
  // вот для использования асинхронных итераторов и генераторов и нужен 
  // for-await-of

  for await (const indx of generateIndex(18, 4)) {
    console.log('for-await-of generated index:', indx)
  }

  printInFrame('Finish print [18, 21] numbers with async generator with for-await-of loop')

  await console.log('Console.log calling with await')

  // но да, он прекрасно фоллбечется на простые итеративные объекты
  // точно также как мы можем вызвать не async функцию с помощью await
  // НО, судя по этой доке 
  // https://2ality.com/2016/10/asynchronous-iteration.html#for-await-of-and-sync-iterables
  // каждое значение массива оборачивается в промиз
  // и этим такой подход и плох, что мы плодим много промизов
  const indexesArForFOR_AWAIT = [22, 22, 24, 25]
  for await (const indx of indexesArForFOR_AWAIT) {
    console.log('for-await-of simple array index:', indx)
  }

  printInFrame('Finish print [22, 25] numbers with simple array with for-await-of loop')


  // и вот есть одна особенность
  // если в for-await передать массив промизов
  // то цикл становится эквивалентным Promise.all
  // смотрите на время перед циклом и в цикле
  // но говорят все же это плохая практика
  // https://stackoverflow.com/questions/59694309/for-await-of-vs-promise-all/59695815#59695815

  console.log('Time before for-await', new Date())
  const arrayPromisesForIndexes = [
    returnIndexWithTimeout(26, 10000, 10000),
    returnIndexWithTimeout(27),
    returnIndexWithTimeout(28),
    returnIndexWithTimeout(29),
    returnIndexWithTimeout(30),
    returnIndexWithTimeout(31),
  ]

  for await (const indx of arrayPromisesForIndexes) {
    console.log('for-await-of array index (with timeout):', indx, 'Time in for-await loop', new Date())
  }

  printInFrame('Finish print [26, 31] numbers with arrayOf promises with for-await-of loop')

})();
