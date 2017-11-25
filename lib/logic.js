/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * A Member grants access to their record to another Member.
 * @param {org.healthcare.records.AuthorizeAccess} authorize - the authorize to be processed
 * @transaction
 */
function authorizeAccess(authorize) {

    var me = getCurrentParticipant();
    console.log('**** AUTH: ' + me.getIdentifier() + ' granting access to ' + authorize.userId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is not already authorized, we authorize them
    var index = -1;

    if(!me.authorized) {
        me.authorized = [];
    }
    else {
        index = me.authorized.indexOf(authorize.userId);
    }

    if(index < 0) {
        me.authorized.push(authorize.userId);

        return getParticipantRegistry('org.healthcare.records.Patient')
        .then(function (userRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
            event.userTransaction = authorize;
            emit(event);

            // persist the state of the member
            return userRegistry.update(me);
        });
    }
}

/**
 * A Member revokes access to their record from another Member.
 * @param {org.healthcare.records.RevokeAccess} revoke - the RevokeAccess to be processed
 * @transaction
 */
function revokeAccess(revoke) {

    var me = getCurrentParticipant();
    console.log('**** REVOKE: ' + me.getIdentifier() + ' revoking access to ' + revoke.userId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is authorized, we remove them
    var index = me.authorized ? me.authorized.indexOf(revoke.userId) : -1;

    if(index>-1) {
        me.authorized.splice(index, 1);

        return getParticipantRegistry('org.healthcare.records.Patient')
        .then(function (userRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
            event.userTransaction = revoke;
            emit(event);

            // persist the state of the member
            return userRegistry.update(me);
        });
    }
}

/**
 * A User adds a report on a Patient.
 * @param {org.healthcare.records.addReport} add
 * @transaction
 */
function addReport(add){
    me = getCurrentParticipant();

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    return getParticipantRegistry('org.healthcare.records.Patient')
        .then(function (userRegistry) {
            return userRegistry.get(add.userId).
                then (function(patient) {
              
                    if(!patient) {
                        throw new Error('A patient does not exist.');
                    }


                    if(!patient.authorized || patient.authorized.indexOf(me.userId) < 0) {
                        throw new Error('You are not authorized to do this.');
                    }
                
                  report = getFactory().newConcept('org.healthcare.records', 'Report');
                  console.log("hi");
                  report.text = add.text;
                  report.title = add.title;
                  report.timestamp = new Date();
                  report.authorId = me.getIdentifier();

                  if (!patient.reports) {
                    patient.reports = [];
                  }
                  patient.reports.push(report);


                  var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
                  event.userTransaction = add;
              
                  emit(event);
                  
                  return userRegistry.update(patient);
              });
        });
}

/* TODO Verify that authorId is the same 
function removeReport(remove){

    var patient = remove.user.getIdentifier();

    if(!patient) {
        throw new Error('A patient does not exist.');
    }

    delete patient.data[data.title];

    return getParticipantRegistry('org.healthcare.records.User')
    .then(function (userRegistry) {

        var event = getFactory().newEvent('org.healthcare.records', 'MemberEvent');
        event.memberTransaction = removeData;
        emit(event);

        return memberRegistry.update(data.patient);
    });
}
*/

/**
 * A User modifies the health data summary of a patient
 * @param {org.healthcare.records.updateHealthData} update
 * @transaction
 */
function updateHealthData(update){
    me = getCurrentParticipant();

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    return getParticipantRegistry('org.healthcare.records.Patient')
        .then(function (userRegistry) {
            return userRegistry.get(update.userId).
                then (function(patient) {
              
                    if(!patient) {
                        throw new Error('A patient does not exist.');
                    }

                    if(!patient.authorized || patient.authorized.indexOf(me.userId) < 0) {
                        throw new Error('You are not authorized to do this.');
                    }


                    for (i in update.healthData) {
                        if (i.indexOf('$') < 0 && update.healthData[i])
                        {
                            patient.healthData[i] = update.healthData[i];
                        }
                    }


                    var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
                    event.userTransaction = update;
                  
                    emit(event);
                      
                    return userRegistry.update(patient);
              });
        });
}
