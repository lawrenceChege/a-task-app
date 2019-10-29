/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Tasks } from './tasks.js'

if (Meteor.isServer) {
    describe('Tasks', () => {
        describe('methods', () => {
            const username = 'larry'
            let taskId, userId;
            before(() => {
                let user = Meteor.users.findOne({ username: username });
                if (!user) {
                    userId = Accounts.createUser({
                        'username': username,
                        'email': 'larry@gmail.com',
                        'password': '12345578',
                    });
                } else {
                    userId = user._id;
                }

            });
            beforeEach(() => {
                Tasks.remove({});
                taskId = Tasks.insert({
                    text: 'Hello world',
                    createdAt: new Date(),
                    owner: userId,
                    username: 'Larry',
                });
            });
            it('can delete owned task', () => {
                // Find the internal implementation of the task method so we can
                // test it in isolation
                const deleteTask = Meteor.server.method_handlers['tasks.remove'];

                // Set up a fake method invocation that looks like what the method expects
                const invocation = { userId };

                // Run the method with `this` set to the fake invocation
                deleteTask.apply(invocation, [taskId]);

                // Verify that the method does what we expected
                assert.equal(Tasks.find().count(), 0);
            })
            it('can insert task', () => {
                const insertTask = Meteor.server.method_handlers['tasks.insert'];
                const invocation = { userId }
                insertTask.apply(invocation, ['hello mest']);
                assert.equal(Tasks.find().count(), 2);

            })
            it('cannot insert task if not logged in',()=>{
                const insertTask = Meteor.server.method_handlers['tasks.insert'];
                const invocation = { }
                
                assert.throws(()=>{
                    insertTask.apply(invocation, ['hello mest']);
                }, Meteor.Error, 'Insert not authorized')
                assert.equal(Tasks.find().count(), 1);

            })
            it('cannot delete someone else task',()=>{
                Tasks.update(taskId, { $set: { private: true } });
                const deleteTask = Meteor.server.method_handlers['tasks.remove'];
                const userId = Random.id();
                const invocation = { userId }
                
                assert.throws(()=>{
                    deleteTask.apply(invocation, [taskId]);
                }, Meteor.Error, 'You are not allowed to delete this')
                assert.equal(Tasks.find().count(), 1);
                
            })
            it('can set own task private',()=>{
                const setPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
                const invocation = { userId }               
                setPrivate.apply(invocation, [taskId, true]);
                assert.equal(Tasks.find({private:true}).count(), 1);
                
            })
            it('cannot set someone else task private',()=>{
                Tasks.update(taskId, { $set: { private: true } });
                const setPrivate = Meteor.server.method_handlers['tasks.setPrivate']
                const userId = Random.id();
                const invocation = { userId }
                
                assert.throws(()=>{
                    setPrivate.apply(invocation, [taskId, true]);
                }, Meteor.Error, 'You cannot set this to private')
                assert.equal(Tasks.find({private:true}).count(), 1);
                
            })
            it('can set own task checked',()=>{
                const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
                const invocation = { userId }               
                setChecked.apply(invocation, [taskId, true]);
                assert.equal(Tasks.find({checked:true}).count(), 1);
                
            })
            it('cannot set someone else task checked',()=>{
                Tasks.update(taskId, { $set: { private: true } });
                const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
                const userId = Random.id();
                const invocation = { userId }
                
                assert.throws(()=>{              
                    setChecked.apply(invocation, [taskId, true]);
                }, Meteor.Error, 'You are not allowed to check this')
                assert.equal(Tasks.find({checked:true}).count(), 0);
                
            })
        })
    })
}
