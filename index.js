var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var Meetup = require("meetup")
server.listen(3002)

var mup = new Meetup()
let topicsCounter = {}
var currentTop10 = []

io.on('connection', socket => {
  console.log('got connection')
  socket.emit('currentTop10', currentTop10)
})

mup.stream("/2/rsvps", stream => {
  stream
    .on("data", item => {
      // console.log(item)

      const topicNames =
        item.group.group_topics.map(
        topic => topic.topic_name
      )

      if (!(topicNames.includes('Software Development'))) { return }

      io.emit('event', item)

      topicNames.forEach(name => {
        if (topicsCounter[name]) {
          topicsCounter[name]++
        } else {
          topicsCounter[name] = 1
        }
      })
      // console.log(topicsCounter)

      const arrayOfTopics = Object.keys(topicsCounter)
      arrayOfTopics.sort((topicA, topicB) => {
        if (topicsCounter[topicA] > topicsCounter[topicB]) {
          return -1
        }
        else if (topicsCounter[topicB] > topicsCounter[topicA]) {
          return 1
        } else {
          return 0
        }
      })
      // console.log(arrayOfTopics)

      const namesTop10Topics = [ ...arrayOfTopics.slice(0,10)]

      const top10Topics = namesTop10Topics.map(topic => {
        var count = (topicsCounter[topic])
        return { topic, count }
      })
      console.log(top10Topics)
      io.emit('top10', top10Topics)
      currentTop10 = top10Topics

    }).on("error", e => {
      console.log("error! " + e)
    })
})
