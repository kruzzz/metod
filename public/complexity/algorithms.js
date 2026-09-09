export const topics = {
 divisors:{names:['Полный перебор','Поиск до корня'],big:['O(n)','O(√n)'],unit:'проверок делимости',small:[1,100,36],large:[10,1000000,10000],note:'Делители образуют пары: если один больше √n, второй меньше √n. Для полного квадрата корень добавляется один раз. Здесь n — само число, а не количество цифр в его записи.'},
 sort:{names:['Пузырьковая сортировка','Быстрая сортировка'],big:['O(n²); лучший O(n)','в среднем O(n log n); худший O(n²)'],unit:'сравнений',small:[2,32,16],large:[10,2000,500],note:'Обе сортировки получают одинаковый массив. Опорный элемент QuickSort — последний: отсортированные данные дают худший случай. Оранжевый — сравниваемые элементы, бордовый — опорный.'},
 search:{names:['Линейный поиск','Бинарный поиск'],big:['O(n)','O(log n)'],unit:'проверенных элементов',small:[2,64,32],large:[10,1000000,10000],note:'Ищем последний элемент в отсортированном массиве — худший случай линейного поиска. Бинарный поиск требует отсортированных данных; стоимость предварительной сортировки здесь не учитывается.'},
 fib:{names:['Рекурсия без памяти','Итеративный алгоритм'],big:['O(2ⁿ), верхняя оценка','O(n)'],unit:'сложений',small:[1,15,8],large:[10,28,20],note:'В рекурсии одни и те же F(k) вычисляются снова. Цикл хранит два предыдущих значения. Считаем сложения; F(0) = 0, F(1) = 1.'}
};
export function makeData(n,kind='random') {return Array.from({length:n},(_,i)=>kind==='sorted'?i+1:kind==='reverse'?n-i:kind==='duplicates'?1+(i*7%5):1+((i*73+19)%Math.max(n,2)));}
export function* run(topic,variant,n,data=[],trace=true){
 let ops=0; const a=data.slice(); const state=(extra)=>({ops,...extra});
 if(topic==='divisors') {const found=[];const limit=variant?Math.floor(Math.sqrt(n)):n;for(let d=1;d<=limit;d++){ops++;if(n%d===0){found.push(d);if(variant&&d!==n/d)found.push(n/d);}if(trace)yield state({active:[d],found:found.slice(),text:`Проверяем ${n} % ${d} = ${n%d}`,line:variant?4:3});}return state({found:found.sort((x,y)=>x-y),text:`Делители: ${found.sort((x,y)=>x-y).join(', ')}`,line:variant?8:5});}
 if(topic==='search'){let result=-1;const target=n; if(!variant){for(let i=0;i<n;i++){ops++;if(trace)yield state({active:[i],text:`Ищем ${target}: проверяем ${i+1}`,line:2});if(i+1===target){result=i;break;}}}else{let lo=0,hi=n-1;while(lo<=hi){const mid=Math.floor((lo+hi)/2);ops++;if(trace)yield state({active:[mid],range:[lo,hi],text:`Диапазон ${lo+1}…${hi+1}, середина ${mid+1}`,line:4});if(mid+1===target){result=mid;break;}if(mid+1<target)lo=mid+1;else hi=mid-1;}}return state({active:[result],text:`Найдено ${target}, индекс ${result}`,line:variant?6:3});}
 if(topic==='sort') {if(!variant){for(let r=a.length-1;r>0;r--){let changed=false;for(let i=0;i<r;i++){ops++;if(trace)yield state({data:a.slice(),active:[i,i+1],text:`Сравниваем ${a[i]} и ${a[i+1]}`,line:5});if(a[i]>a[i+1]){[a[i],a[i+1]]=[a[i+1],a[i]];changed=true;}}if(!changed)break;}}else{const stack=[[0,a.length-1]];while(stack.length){const [lo,hi]=stack.pop();if(lo>=hi)continue;const pivot=a[hi];let p=lo;for(let j=lo;j<hi;j++){ops++;if(trace)yield state({data:a.slice(),active:[j,p],pivot:hi,range:[lo,hi],text:`Участок ${lo}…${hi}: ${a[j]} ≤ ${pivot}?`,line:6});if(a[j]<=pivot){[a[p],a[j]]=[a[j],a[p]];p++;}}[a[p],a[hi]]=[a[hi],a[p]];stack.push([p+1,hi],[lo,p-1]);}}return state({data:a,text:'Массив отсортирован',line:variant?12:9});}
 if(topic==='fib') {let value;if(!variant){function* rec(k,depth){if(trace)yield state({text:`${'· '.repeat(depth)}F(${k})`,line:2});if(k<2)return k;const left=yield* rec(k-1,depth+1);const right=yield* rec(k-2,depth+1);ops++;if(trace)yield state({text:`F(${k}) = ${left} + ${right} = ${left+right}`,line:3});return left+right;}value=yield* rec(n,0);}else{let x=0,y=1;for(let i=0;i<n;i++){ops++;[x,y]=[y,x+y];if(trace)yield state({text:`Шаг ${i+1}: F(${i+1}) = ${x}`,line:4});}value=x;}return state({value,text:`F(${n}) = ${value}`,line:variant?5:3});}
}
export const python={
divisors:[`def divisors(n):
    result = []
    for d in range(1, n + 1):
        if n % d == 0: result.append(d)
    return result`,`from math import isqrt
def divisors(n):
    result = []
    for d in range(1, isqrt(n) + 1):
        if n % d == 0:
            result.append(d)
            if d != n // d: result.append(n // d)
    return sorted(result)`],
sort:[`def bubble(a):
    for right in range(len(a) - 1, 0, -1):
        changed = False
        for i in range(right):
            if a[i] > a[i + 1]:
                a[i], a[i + 1] = a[i + 1], a[i]
                changed = True
        if not changed: break
    return a`,`def quick(a, lo, hi):
    if lo >= hi: return
    pivot, p = a[hi], lo
    for j in range(lo, hi):
        # Одно сравнение с опорным
        if a[j] <= pivot:
            a[p], a[j] = a[j], a[p]
            p += 1
    a[p], a[hi] = a[hi], a[p]
    quick(a, lo, p - 1)
    quick(a, p + 1, hi)
    return a`],
search:[`def linear(a, target):
    for i, value in enumerate(a):
        if value == target: return i
    return -1`,`def binary(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        value = a[mid]
        if value == target: return mid
        if value < target: lo = mid + 1
        else: hi = mid - 1
    return -1`],
fib:[`def fib(n):
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)`,`def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`]
};
