class peopleConstructor{
    constructor (name, age, state){
    this.name = name
    this.age = age
    this.state = state
    }
    printPerson(){ console.log(`${this.name}, ${this.age}, ${this.state}`)}
}
const person1 = new peopleConstructor("john",23,"CA")
const person2 = new peopleConstructor("kim",27,"SC")
person1.printPerson()
person2.printPerson()


